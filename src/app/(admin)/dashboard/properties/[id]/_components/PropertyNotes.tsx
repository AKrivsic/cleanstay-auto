'use client';

interface PropertyNote {
  id: string;
  text: string;
  created_at: string;
  author: string;
}

interface PropertyNotesProps {
  notes: PropertyNote[];
}

// Property notes component
export function PropertyNotes({ notes }: PropertyNotesProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="admin-property-notes">
      {notes.length === 0 ? (
        <div className="admin-empty-state">
          <p>Žádné poznámky k zobrazení</p>
        </div>
      ) : (
        <div className="admin-notes-list">
          {notes.map((note) => (
            <div key={note.id} className="admin-note-item">
              <div className="admin-note-header">
                <span className="admin-note-author">{note.author}</span>
                <span className="admin-note-date">
                  {formatDate(note.created_at)} {formatTime(note.created_at)}
                </span>
              </div>
              
              <div className="admin-note-content">
                <p className="admin-note-text">{note.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="admin-notes-footer">
        <p className="admin-notes-info">
          Celkem {notes.length} poznámek
        </p>
      </div>
    </div>
  );
}





