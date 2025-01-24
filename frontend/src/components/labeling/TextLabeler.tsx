import React, { useState, useEffect, useCallback, JSX } from 'react';
import { Search, Settings, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { Label, LabelType } from '@/types/project';

// TextLabeler Props interface
interface TextLabelerProps {
  text: string;
  initialLabels: Label[];
  labelTypes: LabelType[];
  onCreateLabel: (labelTypeId: number, startOffset: number, endOffset: number, value: string) => Promise<void>;
  onSaveLabels: (labels: Label[]) => Promise<void>;
}

// Selection state interface
interface SelectionState {
  text: string;
  start: number;
  end: number;
}

const TextLabeler: React.FC<TextLabelerProps> = ({ 
  text, 
  initialLabels,
  labelTypes, 
  onCreateLabel, 
  onSaveLabels 
}) => {
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [selectedText, setSelectedText] = useState<SelectionState | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(1);
  const [labelSearchQuery, setLabelSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState({
    searchAllFiles: false,
    regexSearch: false,
    exactMatch: false
  });

  // Filter labels based on search query
  const filteredLabels = labelSearchQuery
    ? labels.filter(label => {
        const labelType = labelTypes.find(type => type.id === label.label_type_id);
        return label.value.toLowerCase().includes(labelSearchQuery.toLowerCase()) ||
               labelType?.name.toLowerCase().includes(labelSearchQuery.toLowerCase());
      })
    : labels;

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
    const labelType = labelTypes.find(type => type.hotkey === e.key);
    if (labelType && selectedText) {
      addLabel(labelType.id);
    }
  }, [selectedText, labelTypes]);

  useEffect(() => {
    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [handleKeyPress]);

  // Add a new label
  const addLabel = async (labelTypeId: number) => {
    if (!selectedText) return;

    try {
      await onCreateLabel(
        labelTypeId,
        selectedText.start,
        selectedText.end,
        selectedText.text
      );

      const newLabel: Label = {
        id: Date.now(), // Temporary ID until DB assigns one
        file_id: 0,
        label_type_id: labelTypeId,
        start_offset: selectedText.start,
        end_offset: selectedText.end,
        value: selectedText.text,
        created_by: '', // Should be set by backend
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
  const removeLabel = (labelId: number) => {
    setLabels(prev => prev.filter(label => label.id !== labelId));
  };

  // Render text with highlighted labels
  const renderText = () => {
    if (!text) return null;

    const sortedLabels = [...labels].sort((a, b) => a.start_offset - b.start_offset);
    let lastIndex = 0;
    const elements: JSX.Element[] = [];

    sortedLabels.forEach((label, index) => {
      if (label.start_offset > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, label.start_offset)}
          </span>
        );
      }

      const labelType = labelTypes.find(type => type.id === label.label_type_id);
      elements.push(
        <span
          key={label.id}
          style={{ backgroundColor: labelType?.color + '40' }}
          className="relative group cursor-pointer rounded px-1"
        >
          {text.slice(label.start_offset, label.end_offset)}
          <span className="absolute -top-5 left-0 hidden bg-gray-800 px-2 py-1 text-xs text-white rounded group-hover:block z-10">
            {labelType?.name}
            <button 
              onClick={() => removeLabel(label.id)}
              className="ml-2 hover:text-red-300"
            >
              ×
            </button>
          </span>
        </span>
      );
      lastIndex = label.end_offset;
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in text..."
              className="w-64 border-none text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-md p-1.5 hover:bg-gray-100">
            <Settings className="h-5 w-5 text-gray-600" />
          </button>
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
              {labelTypes.map((labelType) => (
                <button
                  key={labelType.id}
                  onClick={() => {
                    setSelectedEntityType(labelType.id);
                    if (selectedText) {
                      addLabel(labelType.id);
                    }
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                    selectedEntityType === labelType.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: labelType.color }}
                    />
                    {labelType.name}
                  </div>
                  <span className="text-xs text-gray-500">{labelType.hotkey}</span>
                </button>
              ))}
            </div>

            {/* Label Search Section */}
            <div className="space-y-2 pt-4">
              <h3 className="font-semibold text-gray-900">Search Labels</h3>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={labelSearchQuery}
                  onChange={(e) => setLabelSearchQuery(e.target.value)}
                  placeholder="Search labels..."
                  className="w-full text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Search Options Section */}
            <div className="space-y-2 pt-4">
              <h3 className="font-semibold text-gray-900">Search Options</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.searchAllFiles}
                    onChange={(e) => setSearchOptions(prev => ({ ...prev, searchAllFiles: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Search all files</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.regexSearch}
                    onChange={(e) => setSearchOptions(prev => ({ ...prev, regexSearch: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Regex search</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={searchOptions.exactMatch}
                    onChange={(e) => setSearchOptions(prev => ({ ...prev, exactMatch: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Exact match</span>
                </label>
              </div>
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