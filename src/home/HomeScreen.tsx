import { useMemo, useState } from "react";
import type { SavedGraph } from "../editor/model/types";
import type { GraphTemplate } from "./templates";

type HomeScreenProps = {
  graphs: SavedGraph[];
  activeGraphId: string | null;
  templates: GraphTemplate[];
  onCreateBlank: () => void;
  onCreateFromTemplate: (templateId: string) => void;
  onImportJson: () => void;
  onOpenGraph: (graphId: string) => void;
  onRenameGraph: (graphId: string, name: string) => void;
  onDuplicateGraph: (graphId: string) => void;
  onDeleteGraph: (graphId: string) => void;
  onOpenHelp: () => void;
};

export function HomeScreen({
  graphs,
  activeGraphId,
  templates,
  onCreateBlank,
  onCreateFromTemplate,
  onImportJson,
  onOpenGraph,
  onRenameGraph,
  onDuplicateGraph,
  onDeleteGraph,
  onOpenHelp
}: HomeScreenProps) {
  const [editingGraphId, setEditingGraphId] = useState<string | null>(null);
  const [nameDraftById, setNameDraftById] = useState<Record<string, string>>({});

  const recentGraphs = useMemo(
    () => [...graphs].sort((a, b) => b.updatedAt - a.updatedAt),
    [graphs]
  );

  return (
    <section className="home-screen" aria-label="Home">
      <div className="home-header">
        <h1>ProtoGraph</h1>
        <p>Open recent graphs, start from scratch, or use demos to get moving.</p>
      </div>

      <div className="home-layout">
        <section className="home-card home-quick-actions">
          <h2>Quick Actions</h2>
          <div className="home-action-grid">
            <button className="home-action-button is-primary" onClick={onCreateBlank}>
              <span className="material-symbols-outlined">note_add</span>
              New Blank Graph
            </button>
            <button className="home-action-button" onClick={onImportJson}>
              <span className="material-symbols-outlined">upload_file</span>
              Import JSON
            </button>
          </div>
        </section>

        <section className="home-card home-templates">
          <h2>Start From Template</h2>
          <div className="home-template-list">
            {templates.map((template) => (
              <button
                key={template.id}
                className="home-template-card"
                onClick={() => onCreateFromTemplate(template.id)}
              >
                <strong>{template.title}</strong>
                <span>{template.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="home-card home-recent">
          <h2>Recent Graphs</h2>
          {recentGraphs.length === 0 ? (
            <div className="home-empty-state">
              <p>No saved graphs yet.</p>
              <p>Create a blank graph or choose a template to begin.</p>
            </div>
          ) : (
            <ul className="home-graph-list">
              {recentGraphs.map((graph) => {
                const isEditing = editingGraphId === graph.id;
                const draft = nameDraftById[graph.id] ?? graph.name;
                return (
                  <li key={graph.id} className={`home-graph-row ${graph.id === activeGraphId ? "is-active" : ""}`}>
                    <div className="home-graph-main">
                      {isEditing ? (
                        <input
                          value={draft}
                          onChange={(event) =>
                            setNameDraftById((prev) => ({ ...prev, [graph.id]: event.target.value }))
                          }
                          onBlur={() => {
                            onRenameGraph(graph.id, draft);
                            setEditingGraphId(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              onRenameGraph(graph.id, draft);
                              setEditingGraphId(null);
                            } else if (event.key === "Escape") {
                              setNameDraftById((prev) => ({ ...prev, [graph.id]: graph.name }));
                              setEditingGraphId(null);
                            }
                          }}
                          aria-label={`Rename graph ${graph.name}`}
                          autoFocus
                        />
                      ) : (
                        <button className="home-open-link" onClick={() => onOpenGraph(graph.id)}>
                          {graph.name}
                        </button>
                      )}
                      <span>{formatUpdatedAt(graph.updatedAt)}</span>
                    </div>
                    <div className="home-graph-actions">
                      <button onClick={() => onOpenGraph(graph.id)}>Open</button>
                      <button
                        onClick={() => {
                          setNameDraftById((prev) => ({ ...prev, [graph.id]: graph.name }));
                          setEditingGraphId(graph.id);
                        }}
                      >
                        Rename
                      </button>
                      <button onClick={() => onDuplicateGraph(graph.id)}>Copy</button>
                      <button className="is-danger" onClick={() => onDeleteGraph(graph.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="home-card home-learn">
          <h2>Learn ProtoGraph</h2>
          <div className="home-learn-links">
            <button className="home-link-card" onClick={onOpenHelp}>
              <strong>Controls and Hotkeys</strong>
              <span>Open in-app help and shortcuts</span>
            </button>
            <button className="home-link-card" onClick={onOpenHelp}>
              <strong>Editing Essentials</strong>
              <span>Learn connect, select, rename, and delete workflows</span>
            </button>
            <button className="home-link-card" onClick={onOpenHelp}>
              <strong>Navigation Modes</strong>
              <span>Understand mouse vs. trackpad behavior</span>
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function formatUpdatedAt(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}
