import React, { useState } from 'react';
import { Cpu, X, Copy, Check, Terminal, ExternalLink, Lightbulb } from 'lucide-react';

export default function ESP32Modal({ isOpen, onClose, deviceId }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleArduinoCode = `// ESP32 Smart Study Lamp Integration
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:5001/api/lamp";
const char* deviceId = "${deviceId}";

void sendLampState(bool isOn) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String endpoint = String(serverUrl) + (isOn ? "/on" : "/off");
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");

    String payload = "{\\"deviceId\\":\\"" + String(deviceId) + "\\"}";
    int httpResponseCode = http.POST(payload);

    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");
}

void loop() {
  // Trigger sendLampState(true) when lamp switch turned ON
  // Trigger sendLampState(false) when lamp switch turned OFF
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ESP32 Hardware Guide
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How your microcontroller communicates with this dashboard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              REST API Contract
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              The server calculates all durations using server time in the Asia/Kolkata timezone. The ESP32 does not need a real-time clock (RTC).
            </p>
            <div className="mt-2 space-y-1 font-mono text-xs">
              <div className="text-emerald-700 dark:text-emerald-400">POST /api/lamp/on  {`{"deviceId": "${deviceId}"}`}</div>
              <div className="text-rose-700 dark:text-rose-400">POST /api/lamp/off {`{"deviceId": "${deviceId}"}`}</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-slate-500" />
                Arduino / ESP32 C++ Snippet
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 dark:bg-slate-950 font-mono text-[11px] overflow-x-auto border border-slate-800 max-h-64 leading-normal">
              {sampleArduinoCode}
            </pre>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
          >
            Got it, thanks!
          </button>
        </div>

      </div>
    </div>
  );
}
