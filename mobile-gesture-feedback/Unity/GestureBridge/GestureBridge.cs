using System.Collections.Generic;
using UnityEngine;

namespace GestureBridge
{
    /// <summary>
    /// Bridge for converting gesture data to Unity input events.
    /// Consumes gesture.proto schema and produces Unity-friendly events.
    /// </summary>
    public class GestureBridge
    {
        private readonly GestureMap _gestureMap;
        private readonly float _confidenceThreshold;
        private readonly float _overrideThreshold;

        public GestureBridge(GestureMap gestureMap, float threshold = 0.7f, float overrideThreshold = 0.85f)
        {
            _gestureMap = gestureMap;
            _confidenceThreshold = threshold;
            _overrideThreshold = overrideThreshold;
        }

        /// <summary>
        /// Parse incoming gesture data and produce Unity input events.
        /// </summary>
        /// <param name="gestureName">Name of the detected gesture</param>
        /// <param name="rawData">Raw gesture parameters</param>
        /// <returns>GestureResult with intent and confidence, or null if below threshold</returns>
        public GestureResult? ProcessGesture(string gestureName, Dictionary<string, float> rawData)
        {
            if (!_gestureMap.Gestures.TryGetValue(gestureName, out var definition))
            {
                Debug.LogWarning($"[GestureBridge] Unknown gesture: {gestureName}");
                return null;
            }

            var intent = new Intent
            {
                Action = definition.Action,
                Source = definition.Source,
                Confidence = 0.8f,
                ConfidenceOverrideThreshold = _overrideThreshold
            };

            // Map gesture axes to intent parameters
            foreach (var axis in definition.Axes)
            {
                if (rawData.TryGetValue(axis, out var value))
                {
                    switch (axis)
                    {
                        case "x":
                            intent.Position = intent.Position ?? new Vector3();
                            intent.Position.X = value;
                            break;
                        case "y":
                            intent.Position = intent.Position ?? new Vector3();
                            intent.Position.Y = value;
                            break;
                        case "z":
                            intent.Position = intent.Position ?? new Vector3();
                            intent.Position.Z = value;
                            break;
                    }
                }
            }

            float confidence = intent.Confidence;

            if (confidence < _confidenceThreshold)
            {
                Debug.Log($"[GestureBridge] Gesture {gestureName} below threshold: {confidence} < {_confidenceThreshold}");
                return null;
            }

            return new GestureResult
            {
                GestureName = gestureName,
                Intent = intent,
                Confidence = confidence
            };
        }

        /// <summary>
        /// Process a full GestureEvent from the transport layer.
        /// </summary>
        public void ProcessEvent(GestureEvent evt)
        {
            var result = ProcessGesture(evt.GestureId, new Dictionary<string, float>());
            if (result != null)
            {
                result.Intent = evt.Intent;
                result.Confidence = evt.Intent.Confidence;
                DispatchToUnity(result);
            }
        }

        /// <summary>
        /// Convert GestureResult to Unity events.
        /// </summary>
        public void DispatchToUnity(GestureResult result)
        {
            var intent = result.Intent;
            
            // Check override threshold - mobile queues, VR confirms
            bool needsVrConfirmation = intent.Confidence < _overrideThreshold;
            
            Debug.Log($"[GestureBridge] {intent.Action} (confidence: {intent.Confidence:F2}, override: {needsVrConfirmation})");

            switch (intent.Action?.ToLower())
            {
                case "move":
                    if (intent.Position != null)
                    {
                        var unityPos = new UnityEngine.Vector3(intent.Position.X, intent.Position.Y, intent.Position.Z);
                        Debug.Log($"[GestureBridge] Move to {unityPos}");
                        // TODO: Dispatch to active object transform
                    }
                    break;

                case "rotate":
                    if (intent.Rotation != null)
                    {
                        var unityRot = new UnityEngine.Vector3(intent.Rotation.X, intent.Rotation.Y, intent.Rotation.Z);
                        Debug.Log($"[GestureBridge] Rotate by {unityRot}");
                    }
                    break;

                case "scale":
                    if (intent.Scale != null)
                    {
                        var unityScale = new UnityEngine.Vector3(intent.Scale.X, intent.Scale.Y, intent.Scale.Z);
                        Debug.Log($"[GestureBridge] Scale to {unityScale}");
                    }
                    break;

                case "select":
                    Debug.Log($"[GestureBridge] Select target: {intent.Target}");
                    break;
            }

            // Log thermal context if present
            // (handled separately via thermal event listener)
        }
    }
}
