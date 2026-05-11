import { useState } from 'react';
import type { SectionSchema } from '../../types/formBuilder';
import { SectionCard } from './SectionCard';

interface BuilderCanvasProps {
  sections: SectionSchema[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  onDeleteSection: (id: string) => void;
  onReorderSections: (from: number, to: number) => void;
  onAddSection: () => void;
}

export function BuilderCanvas({
  sections,
  selectedSectionId,
  onSelectSection,
  onDeleteSection,
  onReorderSections,
  onAddSection
}: BuilderCanvasProps) {
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function handleDragStart(idx: number) {
    setDragSrcIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (overIdx !== idx) setOverIdx(idx);
  }

  function handleDrop(idx: number) {
    if (dragSrcIdx !== null && dragSrcIdx !== idx) {
      onReorderSections(dragSrcIdx, idx);
    }
    setDragSrcIdx(null);
    setOverIdx(null);
  }

  function handleDragEnd() {
    setDragSrcIdx(null);
    setOverIdx(null);
  }

  return (
    <div className="fb-canvas">
      <div className="fb-canvas__hint">Select a section to edit its fields in the settings panel</div>

      <div className="fb-canvas__sections">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            draggable={!section.locked}
            onDragStart={!section.locked ? () => handleDragStart(idx) : undefined}
            onDragOver={!section.locked ? (e) => handleDragOver(e, idx) : undefined}
            onDrop={!section.locked ? () => handleDrop(idx) : undefined}
            onDragEnd={handleDragEnd}
            className={`fb-section-drag-wrapper${overIdx === idx && dragSrcIdx !== idx ? ' fb-section-drag-wrapper--over' : ''}`}
          >
            <SectionCard
              section={section}
              isSelected={selectedSectionId === section.id}
              onSelect={() => onSelectSection(section.id)}
              onDelete={section.locked ? undefined : () => onDeleteSection(section.id)}
            />
          </div>
        ))}
      </div>

      <button type="button" className="fb-add-section-btn" onClick={onAddSection}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Section
      </button>
    </div>
  );
}
