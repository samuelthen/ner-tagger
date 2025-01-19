import React, { useState, useEffect, useCallback, JSX } from 'react';
import { Search, Settings, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { Label } from '@/types/project';

// Entity type interface
interface EntityType {
  key: string;
  name: string;
  color: string;
  hotkey: string;
}

// TextLabeler Props interface
interface TextLabelerProps {
  text: string;
  initialLabels: Label[];
  onCreateLabel: (type: string, start: number, end: number, value: string) => Promise<void>;
  onSaveLabels: (labels: Label[]) => Promise<void>;
}

// Selection state interface
interface SelectionState {
  text: string;
  start: number;
  end: number;
}

// Entity types for labels
const entityTypes: EntityType[] = [
  { key: 'PER', name: 'Person', color: '#EF4444', hotkey: '1' },
  { key: 'ORG', name: 'Organization', color: '#3B82F6', hotkey: '2' },
  { key: 'LOC', name: 'Location', color: '#10B981', hotkey: '3' },
  { key: 'GEO', name: 'Geopolitical', color: '#F59E0B', hotkey: '4' },
  { key: 'DAT', name: 'Date', color: '#8B5CF6', hotkey: '5' },
];

const TextLabeler: React.FC<TextLabelerProps> = ({ 
  text, 
  initialLabels, 
  onCreateLabel, 
  onSaveLabels 
}) => {
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [selectedText, setSelectedText] = useState<SelectionState | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(1);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const start = range.startOffset;
    const end = range.endOffset;
    const selectedText = selection.toString();

    if (selectedText.trim()) {
      setSelectedText({ text: selectedText, start, end });
    }
  }, []);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const entityType = entityTypes.find(type => type.hotkey === e.key);
    if (entityType && selectedText) {
      addLabel(entityType.key);
    }
  }, [selectedText]);

  useEffect(() => {
    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  // Add a new label
  const addLabel = async (entityTypeKey: string) => {
    if (!selectedText) return;

    try {
      await onCreateLabel(
        entityTypeKey,
        selectedText.start,
        selectedText.end,
        selectedText.text
      );

      const newLabel: Label = {
        id: Date.now().toString(),
        file_id: 0,
        type: entityTypeKey,
        start: selectedText.start,
        end: selectedText.end,
        value: selectedText.text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setLabels(prev => [...prev, newLabel]);
      setSelectedText(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Error adding label:', error);
    }
  };

  // Remove a label
  const removeLabel = (labelId: string) => {
    setLabels(prev => prev.filter(label => label.id !== labelId));
  };

  // Render text with highlighted labels
  const renderText = () => {
    if (!text) return null;

    const sortedLabels = [...labels].sort((a, b) => a.start - b.start);
    let lastIndex = 0;
    const elements: JSX.Element[] = [];

    sortedLabels.forEach((label, index) => {
      if (label.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, label.start)}
          </span>
        );
      }

      const entityType = entityTypes.find(type => type.key === label.type);
      elements.push(
        <span
          key={label.id}
          style={{ backgroundColor: entityType?.color + '40' }}
          className="relative group cursor-pointer rounded px-1"
        >
          {text.slice(label.start, label.end)}
          <span className="absolute -top-5 left-0 hidden bg-gray-800 px-2 py-1 text-xs text-white rounded group-hover:block z-10">
            {entityType?.name}
            <button 
              onClick={() => removeLabel(label.id)}
              className="ml-2 hover:text-red-300"
            >
              ×
            </button>
          </span>
        </span>
      );
      lastIndex = label.end;
    });

    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-md border px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search in text..."
              className="w-64 border-none text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-md p-1.5 hover:bg-gray-100">
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button className="rounded-md p-1 hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span>{currentIndex} of {totalItems}</span>
            <button className="rounded-md p-1 hover:bg-gray-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <button 
            onClick={() => onSaveLabels(labels)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Save Labels
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Text content */}
        <div className="flex-1 overflow-auto p-6">
          <div
            className="min-h-[200px] rounded-lg border bg-white p-4 text-gray-800 shadow-sm"
            onMouseUp={handleTextSelection}
          >
            {renderText()}
          </div>
        </div>

        {/* Labels sidebar */}
        <div className="w-64 border-l bg-white p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Named Entity Recognition</h3>
            <div className="space-y-2">
              {entityTypes.map((entityType) => (
                <button
                  key={entityType.key}
                  onClick={() => {
                    setSelectedEntityType(entityType.key);
                    if (selectedText) {
                      addLabel(entityType.key);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    selectedEntityType === entityType.key
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: entityType.color }}
                    />
                    {entityType.name}
                  </div>
                  <span className="text-xs text-gray-500">{entityType.hotkey}</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <h3 className="mb-2 font-medium text-gray-900">Keyboard Shortcuts</h3>
              <div className="rounded-md bg-gray-50 p-3 text-sm">
                <p className="text-gray-500">Select text and press the number key to apply the corresponding label.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextLabeler;