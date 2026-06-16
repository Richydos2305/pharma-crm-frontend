import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { SuccessCheck } from '../../components/SuccessCheck';
import { BuilderCanvas } from '../../components/form-builder/BuilderCanvas';
import { SectionSettingsPanel } from '../../components/form-builder/SectionSettingsPanel';
import { AddSectionSheet } from '../../components/form-builder/AddSectionSheet';
import { PreviewCanvas } from '../../components/form-builder/PreviewCanvas';
import { AddCustomFieldSheet } from '../../components/form-builder/AddCustomFieldSheet';
import type { FormSchema, SectionSchema, FieldSchema } from '../../types/formBuilder';
import { STARTER_TEMPLATES, PERSONAL_INFO_SECTION } from '../../types/formBuilder';
import { getSettings, publishFormSchema } from '../../api/settings';
import { queryKeys } from '../../api/queryKeys';
import { uniqueSlugId } from '../../utils/slugify';

type BuilderMode = 'build' | 'preview';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Template chooser (shown when form is null) ───────────────────────────────

function TemplatePicker({ onPick, existingSchema }: { onPick: (schema: FormSchema) => void; existingSchema: FormSchema | null }) {
  return (
    <div className="fb-template-picker">
      <div className="fb-template-picker__heading">Patient Intake Form Builder</div>
      <div className="fb-template-picker__sub">Choose a starter template to get going, or start from scratch.</div>
      <div className="fb-template-grid">
        {existingSchema && (
          <button type="button" className="fb-template-tile fb-template-tile--continue" onClick={() => onPick(existingSchema)}>
            <div className="fb-template-tile__label">Current Form</div>
            <div className="fb-template-tile__desc">Pick up where you left off with your existing patient intake form.</div>
            <span className="fb-template-tile__cta">Open my form →</span>
          </button>
        )}
        {STARTER_TEMPLATES.map((t) => (
          <button key={t.key} type="button" className="fb-template-tile" onClick={() => onPick(t.build())}>
            <div className="fb-template-tile__label">{t.label}</div>
            <div className="fb-template-tile__desc">{t.description}</div>
            <span className="fb-template-tile__cta">Use this template →</span>
          </button>
        ))}
        <button
          type="button"
          className="fb-template-tile fb-template-tile--blank"
          onClick={() =>
            onPick({
              id: uid(),
              name: 'Untitled Form',
              status: 'draft',
              sections: [{ ...PERSONAL_INFO_SECTION, fields: PERSONAL_INFO_SECTION.fields.map((f) => ({ ...f })) }]
            })
          }
        >
          <div className="fb-template-tile__label">Blank Form</div>
          <div className="fb-template-tile__desc">Start from scratch with just Personal Information.</div>
          <span className="fb-template-tile__cta">Start blank →</span>
        </button>
      </div>
    </div>
  );
}

// ─── Mobile builder header (templates button + mode toggle) ─────────────────

interface MobileTopControlsProps {
  mode: BuilderMode;
  onTemplatesClick: () => void;
  onModeChange: (mode: BuilderMode) => void;
}

function MobileTopControls({ mode, onTemplatesClick, onModeChange }: MobileTopControlsProps) {
  return (
    <div className="fb-mobile-builder-header">
      <button type="button" className="fb-mobile-templates-btn" onClick={onTemplatesClick}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        Templates
      </button>
      <div className="fb-mode-toggle">
        <button type="button" className={`fb-mode-btn${mode === 'build' ? ' fb-mode-btn--active' : ''}`} onClick={() => onModeChange('build')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          Build
        </button>
        <button type="button" className={`fb-mode-btn${mode === 'preview' ? ' fb-mode-btn--active' : ''}`} onClick={() => onModeChange('preview')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Preview
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FormBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [mode, setMode] = useState<BuilderMode>('build');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showAddFieldMobile, setShowAddFieldMobile] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isModifiedRef = useRef(false);

  // ─── Load existing published schema (used for "Continue" card) ─────────────

  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: getSettings
  });

  // ─── Publish mutation ───────────────────────────────────────────────────────

  const publishMutation = useMutation({
    mutationFn: () => publishFormSchema(schema!, !!settingsData),
    onSuccess: () => {
      setSchema((prev) => (prev ? { ...prev, status: 'published' } : prev));
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 700);
    },
    onError: () => {}
  });

  // ─── Mark form as modified (renames to "Custom Form" on first change) ────────

  const markModified = useCallback(() => {
    if (!isModifiedRef.current) {
      isModifiedRef.current = true;
      setSchema((s) => (s ? { ...s, name: 'Custom Form' } : s));
    }
  }, []);

  // ─── Schema mutation helpers ────────────────────────────────────────────────

  function updateSection(sectionId: string, patch: Partial<SectionSchema>) {
    setSchema((prev) => (prev ? { ...prev, sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)) } : prev));
    markModified();
  }

  function deleteSection(sectionId: string) {
    setSchema((prev) => (prev ? { ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) } : prev));
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
    markModified();
  }

  const addSection = useCallback(
    (sectionData: Omit<SectionSchema, 'id'>) => {
      let newSectionId = '';
      setSchema((prev) => {
        if (!prev) return prev;
        const existingIds = prev.sections.map((s) => s.id);
        newSectionId = uniqueSlugId(sectionData.name, existingIds);
        return { ...prev, sections: [...prev.sections, { ...sectionData, id: newSectionId }] };
      });
      if (newSectionId) setSelectedSectionId(newSectionId);
      markModified();
    },
    [markModified]
  );

  function reorderSections(from: number, to: number) {
    setSchema((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const [moved] = sections.splice(from, 1);
      sections.splice(to, 0, moved);
      return { ...prev, sections };
    });
    markModified();
  }

  function addField(sectionId: string, field: Omit<FieldSchema, 'id'>) {
    setSchema((prev) => {
      if (!prev) return prev;
      const existingIds = prev.sections.flatMap((s) => s.fields.map((f) => f.id));
      const newField: FieldSchema = { ...field, id: uniqueSlugId(field.label, existingIds) };
      return {
        ...prev,
        sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s))
      };
    });
    markModified();
  }

  function deleteField(sectionId: string, fieldId: string) {
    setSchema((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) } : s))
          }
        : prev
    );
    markModified();
  }

  function handlePublish() {
    if (!schema) return;
    publishMutation.mutate();
  }

  function handleSelectSection(id: string) {
    setSelectedSectionId(id);
    setShowMobileSettings(true);
  }

  const selectedSection = schema?.sections.find((s) => s.id === selectedSectionId) ?? null;

  // ─── Mobile top bar ─────────────────────────────────────────────────────────

  const mobileTopBar = schema ? (
    <div className="mobile-topbar">
      <button className="mobile-back-btn" onClick={() => setSchema(null)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="mobile-topbar-title">{schema.name}</span>
      <button className="mobile-topbar-publish-btn" onClick={handlePublish} disabled={publishMutation.isPending}>
        {publishMutation.isPending ? '...' : schema.status === 'published' ? 'Update' : 'Publish'}
      </button>
    </div>
  ) : (
    <div className="mobile-topbar">
      <button className="mobile-back-btn" onClick={() => navigate('/patients')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="mobile-topbar-title">Form Builder</span>
      <div style={{ width: 24 }} />
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!schema) {
    const existingSchema = settingsData?.formConfig?.schema
      ? { ...(settingsData.formConfig.schema as FormSchema), status: 'published' as const }
      : null;
    return (
      <AppLayout mobileTopBar={mobileTopBar}>
        <TemplatePicker
          existingSchema={existingSchema}
          onPick={(s) => {
            setSchema(s);
            setSelectedSectionId(null);
            isModifiedRef.current = false;
          }}
        />
      </AppLayout>
    );
  }

  return (
    <>
      <SuccessCheck visible={showSuccess} />
      <AppLayout mobileTopBar={mobileTopBar}>
        {/* Mobile: templates button + mode toggle (hidden on desktop) */}
        <MobileTopControls
          mode={mode}
          onTemplatesClick={() => {
            setSchema(null);
            setSelectedSectionId(null);
          }}
          onModeChange={setMode}
        />

        {/* Desktop page header: title + mode toggle + actions (hidden on mobile) */}
        <div className="fb-page-header">
          <div className="fb-page-header__left">
            <button
              type="button"
              className="fb-templates-back-btn"
              onClick={() => {
                setSchema(null);
                setSelectedSectionId(null);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Templates
            </button>
            <h1
              className="fb-page-title"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => setSchema((prev) => (prev ? { ...prev, name: e.currentTarget.textContent?.trim() || prev.name } : prev))}
            >
              {schema.name}
            </h1>
            <span className={`fb-status-badge${schema.status === 'published' ? ' fb-status-badge--published' : ''}`}>
              {schema.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
          <div className="fb-page-header__right">
            {/* Build / Preview toggle */}
            <div className="fb-mode-toggle">
              <button type="button" className={`fb-mode-btn${mode === 'build' ? ' fb-mode-btn--active' : ''}`} onClick={() => setMode('build')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                Build
              </button>
              <button type="button" className={`fb-mode-btn${mode === 'preview' ? ' fb-mode-btn--active' : ''}`} onClick={() => setMode('preview')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Preview
              </button>
            </div>

            {/* Desktop actions */}
            <div className="fb-header-actions">
              <button type="button" className="btn-save fb-header-btn" onClick={handlePublish} disabled={publishMutation.isPending}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {publishMutation.isPending ? 'Publishing…' : schema.status === 'published' ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        {/* Builder / Preview workspace */}
        {mode === 'build' ? (
          <div className="fb-workspace">
            {/* Left: canvas */}
            <div className="fb-workspace__canvas">
              <BuilderCanvas
                sections={schema.sections}
                selectedSectionId={selectedSectionId}
                onSelectSection={handleSelectSection}
                onDeleteSection={deleteSection}
                onReorderSections={reorderSections}
                onAddSection={() => setShowAddSection(true)}
              />
            </div>

            {/* Right: settings panel (desktop only, always visible) */}
            <aside className="fb-workspace__settings">
              {selectedSection ? (
                <SectionSettingsPanel
                  section={selectedSection}
                  onUpdate={(patch) => updateSection(selectedSection.id, patch)}
                  onDeleteField={(fieldId) => deleteField(selectedSection.id, fieldId)}
                  onAddField={(field) => addField(selectedSection.id, field)}
                />
              ) : (
                <div className="fb-settings-empty-state">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    style={{ color: 'var(--fg-muted)', marginBottom: 8 }}
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  <div style={{ fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    Select a section in the canvas to edit its settings and fields.
                  </div>
                </div>
              )}
            </aside>
          </div>
        ) : (
          <div className="fb-preview-wrapper">
            <PreviewCanvas schema={schema} />
          </div>
        )}

        {/* Mobile sticky bottom action bar (build mode only) */}
        {mode === 'build' && (
          <div className="fb-mobile-bottombar">
            <button
              type="button"
              className="fb-mobile-bar-btn fb-mobile-bar-btn--outline"
              disabled={!selectedSection}
              onClick={() => setShowAddFieldMobile(true)}
            >
              + Add Custom Field
            </button>
            <button type="button" className="fb-mobile-bar-btn fb-mobile-bar-btn--fill" onClick={() => setShowAddSection(true)}>
              + Add Section
            </button>
          </div>
        )}

        {/* Mobile: bottom sheet for settings */}
        {showMobileSettings && selectedSection && (
          <div className="fb-mobile-settings-overlay" onClick={() => setShowMobileSettings(false)}>
            <div className="fb-mobile-settings-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="fb-mobile-settings-handle" />
              <SectionSettingsPanel
                section={selectedSection}
                onUpdate={(patch) => updateSection(selectedSection.id, patch)}
                onDeleteField={(fieldId) => deleteField(selectedSection.id, fieldId)}
                onAddField={(field) => addField(selectedSection.id, field)}
                onClose={() => setShowMobileSettings(false)}
              />
            </div>
          </div>
        )}

        {/* Mobile: Add Custom Field (from bottom bar) */}
        <AddCustomFieldSheet
          open={showAddFieldMobile && !!selectedSection}
          onAdd={(field) => {
            if (selectedSection) {
              addField(selectedSection.id, field);
              setShowAddFieldMobile(false);
            }
          }}
          onClose={() => setShowAddFieldMobile(false)}
        />

        {/* Add section sheet */}
        <AddSectionSheet open={showAddSection} onAdd={addSection} onClose={() => setShowAddSection(false)} />
      </AppLayout>
    </>
  );
}
