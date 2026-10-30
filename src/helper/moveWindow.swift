import Cocoa
import ApplicationServices

// Expecting args: moveWindow <direction> <distance>
guard CommandLine.arguments.count >= 3 else {
    print("ERROR: Usage: moveWindow <direction> <distance>")
    exit(1)
}

let direction = CommandLine.arguments[1].lowercased()
guard let distance = Double(CommandLine.arguments[2]) else {
    print("ERROR: Invalid distance: \(CommandLine.arguments[2])")
    exit(1)
}

// Check if accessibility permissions are enabled
let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
if !AXIsProcessTrustedWithOptions(options) {
    print("ERROR: Accessibility permission is not granted. Please enable it in System Settings.")
    exit(1)
}

var dx: CGFloat = 0
var dy: CGFloat = 0

switch direction {
case "left":
    dx = -CGFloat(distance)
case "right":
    dx = CGFloat(distance)
case "up":
    dy = -CGFloat(distance)
case "down":
    dy = CGFloat(distance)
default:
    print("ERROR: Invalid direction: \(direction). Must be left, right, up, or down.")
    exit(1)
}

// Find the frontmost application.
// When Raycast closes, the focus shifts back to the previous application.
// However, there could be a slight delay. We wait until Raycast is no longer the active application.
var targetApp = NSWorkspace.shared.frontmostApplication
var attempts = 0
while let app = targetApp, 
      (app.bundleIdentifier == "com.raycast.macos" || app.bundleIdentifier == "com.raycast.Raycast" || app.localizedName == "Raycast"), 
      attempts < 100 {
    Thread.sleep(forTimeInterval: 0.005) // 5ms sleep
    targetApp = NSWorkspace.shared.frontmostApplication
    attempts += 1
}

guard let app = targetApp else {
    print("ERROR: Could not find frontmost application.")
    exit(1)
}

let pid = app.processIdentifier
let appElement = AXUIElementCreateApplication(pid)

var focusedWindow: CFTypeRef?
let result = AXUIElementCopyAttributeValue(appElement, kAXFocusedWindowAttribute as CFString, &focusedWindow)

guard result == .success, let windowElement = focusedWindow else {
    print("ERROR: Could not get focused window of \(app.localizedName ?? "application").")
    exit(1)
}

// Get the current position
var positionValue: CFTypeRef?
let posResult = AXUIElementCopyAttributeValue(windowElement as! AXUIElement, kAXPositionAttribute as CFString, &positionValue)

guard posResult == .success, let posVal = positionValue else {
    print("ERROR: Could not get current window position.")
    exit(1)
}

var currentPoint = CGPoint.zero
AXValueGetValue(posVal as! AXValue, AXValueType(rawValue: kAXValueCGPointType)!, &currentPoint)

// Compute the new position
var newPoint = CGPoint(x: currentPoint.x + dx, y: currentPoint.y + dy)

// Create the new position value
guard let newPositionValue = AXValueCreate(AXValueType(rawValue: kAXValueCGPointType)!, &newPoint) else {
    print("ERROR: Failed to create AXValue for new position.")
    exit(1)
}

// Set the new position
let setError = AXUIElementSetAttributeValue(windowElement as! AXUIElement, kAXPositionAttribute as CFString, newPositionValue)

if setError == .success {
    print("SUCCESS")
} else {
    print("ERROR: Failed to set window position: \(setError)")
    exit(1)
}
