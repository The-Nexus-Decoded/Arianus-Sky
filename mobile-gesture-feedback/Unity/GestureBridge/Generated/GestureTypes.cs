using System.Collections.Generic;

namespace GestureBridge
{
    /// <summary>
    /// Confidence threshold settings for gesture recognition.
    /// </summary>
    public enum ConfidenceThreshold
    {
        ThresholdUnspecified = 0,
        Low = 1,      // 0.5 - for fast, loose gestures
        Medium = 2,   // 0.7 - default
        High = 3      // 0.9 - precise interactions
    }

    /// <summary>
    /// Supported gesture action types.
    /// </summary>
    public enum GestureAction
    {
        ActionUnspecified = 0,
        Move = 1,
        Rotate = 2,
        Scale = 3,
        Select = 4
    }

    /// <summary>
    /// Gesture source types.
    /// </summary>
    public enum GestureSource
    {
        SourceUnspecified = 0,
        Gesture = 1,
        Menu = 2,
        DepthHandle = 3
    }

    /// <summary>
    /// Thermal tier levels for ambient skin system.
    /// </summary>
    public enum ThermalTier
    {
        TierUnspecified = 0,
        TierCool = 1,        // Full color, subtle breathing, 100% opacity
        TierWarm = 2,        // Reduced palette, slower pulse, 85% opacity
        TierHot = 3,         // Monochrome, urgent pulse, 70% opacity
        TierCritical = 4     // Alert color, rapid blink, 100% + overlay
    }

    /// <summary>
    /// 3D vector for position/rotation/scale.
    /// </summary>
    public class GestureVector3
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }
    }

    /// <summary>
    /// Defines a single gesture with its action, axes, and source.
    /// </summary>
    public class GestureDefinition
    {
        public string Action { get; set; }
        public List<string> Axes { get; set; } = new List<string>();
        public string Source { get; set; }
    }

    /// <summary>
    /// Collection of named gesture definitions.
    /// </summary>
    public class GestureMap
    {
        public Dictionary<string, GestureDefinition> Gestures { get; set; } = new Dictionary<string, GestureDefinition>();
        public ConfidenceThresholdValue ConfidenceThreshold { get; set; }
    }

    /// <summary>
    /// Confidence threshold configuration.
    /// </summary>
    public class ConfidenceThresholdValue
    {
        public float UserCanOverride { get; set; } = 0.85f;
        public string BelowThreshold { get; set; }   // mobile queues for VR confirmation
        public string AboveThreshold { get; set; }   // mobile commits, VR animates
    }

    /// <summary>
    /// User intent derived from gesture input.
    /// </summary>
    public class Intent
    {
        public string Action { get; set; }
        public string Target { get; set; }           // entity_id
        public string Source { get; set; }
        public float Confidence { get; set; }
        public float ConfidenceOverrideThreshold { get; set; } = 0.85f;
        public GestureVector3 Position { get; set; }
        public GestureVector3 Rotation { get; set; }
        public GestureVector3 Scale { get; set; }
    }

    /// <summary>
    /// Thermal context for ambient skin system.
    /// </summary>
    public class ThermalContext
    {
        public int Temperature { get; set; }
        public ThermalTier Tier { get; set; }
        public long Timestamp { get; set; }
    }

    /// <summary>
    /// Runtime gesture event with intent and thermal context.
    /// </summary>
    public class GestureEvent
    {
        public string GestureId { get; set; }
        public Intent Intent { get; set; }
        public ThermalContext Thermal { get; set; }
        public long Timestamp { get; set; }
    }

    /// <summary>
    /// Result of gesture recognition with confidence score.
    /// </summary>
    public class GestureResult
    {
        public string GestureName { get; set; }
        public Intent Intent { get; set; }
        public float Confidence { get; set; }
    }
}
