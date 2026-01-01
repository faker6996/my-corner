"use client";

import { Card, Badge, Progress } from "@underverse-ui/underverse";
import { useTranslations } from "next-intl";

interface RightPanelProps {
  imageData?: {
    url: string;
    name: string;
    size: string;
    dimensions: string;
  };
  ocrData?: {
    status: string;
    progress: number;
    text: string;
    confidence: number;
    language: string;
  };
  statistics?: {
    totalTasks: number;
    completedTasks: number;
    errorTasks: number;
    processingTime: string;
  };
}

export function RightPanel({ imageData, ocrData, statistics }: RightPanelProps) {
  const trp = useTranslations('RightPanel');
  return (
    <div className="space-y-6">
      {/* Image Information */}
      {imageData && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">{trp('imageInfo')}</h3>
          <div className="space-y-3">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img 
                src={imageData.url} 
                alt={imageData.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{trp('fileName')}:</span>
                <span className="text-foreground font-medium truncate ml-2">{imageData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{trp('fileSize')}:</span>
                <span className="text-foreground">{imageData.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{trp('dimensions')}:</span>
                <span className="text-foreground">{imageData.dimensions}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* OCR Processing Status */}
      {ocrData && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">{trp('ocrStatus')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{trp('statusLabel')}:</span>
              <Badge 
                variant={ocrData.status === "completed" ? "success" : ocrData.status === "processing" ? "warning" : "danger"}
              >
                {ocrData.status === "completed" ? trp('status.completed') : 
                 ocrData.status === "processing" ? trp('status.processing') : trp('status.error')}
              </Badge>
            </div>
            
            {ocrData.status === "processing" && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{trp('progress')}:</span>
                  <span className="text-foreground">{ocrData.progress}%</span>
                </div>
                <Progress value={ocrData.progress} className="h-2" />
              </div>
            )}

            {ocrData.confidence && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{trp('confidence')}:</span>
                <span className="text-foreground">{ocrData.confidence}%</span>
              </div>
            )}

            {ocrData.language && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{trp('language')}:</span>
                <span className="text-foreground">{ocrData.language}</span>
              </div>
            )}

            {ocrData.text && ocrData.status === "completed" && (
              <div className="mt-4">
                <span className="text-sm text-muted-foreground block mb-2">{trp('result')}:</span>
                <div className="bg-muted/30 rounded-lg p-3 text-sm text-foreground max-h-32 overflow-y-auto border border-border/60">
                  {ocrData.text}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Statistics */}
      {statistics && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">{trp('statistics')}</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <div className="text-lg font-bold text-primary">{statistics.totalTasks}</div>
                <div className="text-xs text-muted-foreground">{trp('totalTasks')}</div>
              </div>
              <div className="text-center p-3 bg-success/5 rounded-lg">
                <div className="text-lg font-bold text-success">{statistics.completedTasks}</div>
                <div className="text-xs text-muted-foreground">{trp('completed')}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-destructive/5 rounded-lg">
                <div className="text-lg font-bold text-destructive">{statistics.errorTasks}</div>
                <div className="text-xs text-muted-foreground">{trp('errors')}</div>
              </div>
              <div className="text-center p-3 bg-info/5 rounded-lg">
                <div className="text-lg font-bold text-info">{statistics.processingTime}</div>
                <div className="text-xs text-muted-foreground">{trp('processingTime')}</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{trp('quickActions')}</h3>
        <div className="space-y-2">
          <button className="w-full text-left p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={trp('actions.upload')}>
            📁 {trp('actions.upload')}
          </button>
          <button className="w-full text-left p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={trp('actions.rerun')}>
            🔄 {trp('actions.rerun')}
          </button>
          <button className="w-full text-left p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={trp('actions.export')}>
            💾 {trp('actions.export')}
          </button>
          <button className="w-full text-left p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={trp('actions.delete')}>
            🗑️ {trp('actions.delete')}
          </button>
        </div>
      </Card>
    </div>
  );
}
