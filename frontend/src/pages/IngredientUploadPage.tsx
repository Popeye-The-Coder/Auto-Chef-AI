import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Camera, Check, X, Plus, Sparkles, AlertCircle,
  Sliders, ArrowRight, RefreshCw, Layers
} from 'lucide-react';
import { ingredientService } from '../services/api';
import { DetectionResult, DetectedItem } from '../types';
import { BoundingBoxViewer } from '../components/BoundingBoxViewer';

export const IngredientUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confidence filter slider
  const [minConfidence, setMinConfidence] = useState<number>(0.25);
  // Manual additions / corrections
  const [manualItem, setManualItem] = useState('');
  const [confirmedItems, setConfirmedItems] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDetectionResult(null);
    setError(null);
  };

  const handleUploadAndDetect = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const result = await ingredientService.uploadAndDetect(selectedFile);
      setDetectionResult(result);
      // Initialize confirmed items
      setConfirmedItems(result.detected_ingredients.map(i => i.name));
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to detect ingredients. Please try another image.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = () => {
    if (!manualItem.trim()) return;
    const clean = manualItem.trim().toLowerCase();
    if (!confirmedItems.includes(clean)) {
      setConfirmedItems([...confirmedItems, clean]);
    }
    setManualItem('');
  };

  const handleRemoveItem = (nameToRemove: string) => {
    setConfirmedItems(confirmedItems.filter(i => i !== nameToRemove));
  };

  const handleConfirmAndAddInventory = async () => {
    if (confirmedItems.length === 0) return;
    setLoading(true);
    try {
      await ingredientService.confirmDetection(confirmedItems, true);
      navigate('/recommendations');
    } catch (err: any) {
      setError('Failed to add ingredients to kitchen.');
    } finally {
      setLoading(false);
    }
  };

  // Filter detected items based on slider
  const filteredDetectedItems = detectionResult?.detected_ingredients.filter(
    item => item.confidence >= minConfidence
  ) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-100 text-forest-800 text-xs font-semibold mb-2">
          <Camera className="w-3.5 h-3.5" />
          <span>Ultralytics YOLOv8 Deep Learning Vision</span>
        </div>
        <h1 className="font-serif font-bold text-3xl text-forest-950">AI Ingredient Recognition</h1>
        <p className="text-sm text-forest-600 mt-1 max-w-2xl">
          Upload a photograph of raw ingredients from your kitchen counter or refrigerator.
          Our model detects individual ingredients with bounding coordinates and confidence scores.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-terracotta-50 border border-terracotta-200 flex items-center gap-3 text-xs text-terracotta-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload / Detection Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Area */}
        <div className="lg:col-span-7 space-y-4">
          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-forest-300 hover:border-forest-600 rounded-3xl p-12 text-center bg-white cursor-pointer transition shadow-soft group min-h-[380px] flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mb-4 group-hover:scale-110 transition shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-lg text-forest-950">Upload Ingredient Photograph</h3>
              <p className="text-xs text-forest-600 mt-1 max-w-xs">
                Supports JPG, PNG, WEBP up to 10MB. Clear lighting and individual items produce optimal confidence.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              <button
                type="button"
                className="mt-6 px-5 py-2.5 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition shadow-soft"
              >
                Choose File
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {detectionResult ? (
                <BoundingBoxViewer
                  imageUrl={detectionResult.image_url}
                  detectedItems={filteredDetectedItems}
                  selectedIndex={selectedIndex}
                  onSelectItem={(idx) => setSelectedIndex(idx)}
                />
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-cream-200 bg-white max-h-[500px]">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto object-contain block max-h-[480px]" />
                </div>
              )}

              {/* Action bar below image */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-cream-300 text-forest-800 hover:bg-cream-100 transition"
                >
                  Change Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />

                {!detectionResult && (
                  <button
                    type="button"
                    onClick={handleUploadAndDetect}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-forest-800 text-white font-bold text-xs uppercase tracking-wider hover:bg-forest-900 transition shadow-soft flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Running YOLO Inference...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>Run AI Ingredient Detection</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detection Results & Manual Correction */}
        <div className="lg:col-span-5 space-y-6">
          {detectionResult ? (
            <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-soft space-y-6">
              {/* Model Info Header */}
              <div className="flex items-center justify-between pb-4 border-b border-cream-200">
                <div>
                  <h3 className="font-serif font-bold text-lg text-forest-950">Detections</h3>
                  <p className="text-[11px] text-forest-600">{detectionResult.model_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {detectionResult.inference_time_ms} ms
                  </span>
                </div>
              </div>

              {/* Confidence Threshold Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-forest-800 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-forest-500" />
                    <span>Confidence Threshold</span>
                  </span>
                  <span className="text-forest-600 font-mono">{Math.round(minConfidence * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full accent-forest-700 cursor-pointer"
                />
              </div>

              {/* Detected Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest-400 mb-2">
                  Recognized ({filteredDetectedItems.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {filteredDetectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                        selectedIndex === idx
                          ? 'border-forest-600 bg-forest-50'
                          : 'border-cream-200 hover:border-forest-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold capitalize text-forest-900">{item.name}</span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-forest-600">
                        {Math.round(item.confidence * 100)}% conf
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmed Checklist / Corrections */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-forest-400 mb-2">
                  Confirmed Ingredients for Pantry ({confirmedItems.length})
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {confirmedItems.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-100 text-forest-900 text-xs font-semibold capitalize"
                    >
                      <span>{name}</span>
                      <button
                        onClick={() => handleRemoveItem(name)}
                        className="hover:text-terracotta-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Manual Add Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualItem}
                    onChange={(e) => setManualItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                    placeholder="Add missing ingredient..."
                    className="flex-1 px-3 py-2 rounded-xl border border-cream-300 bg-cream-50/50 text-xs text-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-600"
                  />
                  <button
                    onClick={handleAddManual}
                    className="p-2 rounded-xl bg-forest-700 text-white hover:bg-forest-800 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleConfirmAndAddInventory}
                  disabled={confirmedItems.length === 0 || loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs uppercase tracking-wider transition shadow-soft flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Save to Pantry & Get Recipes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-cream-200 p-8 text-center shadow-soft">
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-base text-forest-950">Awaiting Photograph</h3>
              <p className="text-xs text-forest-600 mt-1 max-w-xs mx-auto">
                Select an image on the left to activate the YOLO detection pipeline and see real-time ingredient bounding boxes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
