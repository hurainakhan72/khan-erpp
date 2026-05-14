import React, { useState, useEffect } from "react";


export default function AnnouncementsFeed() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");


  // Load announcements from localStorage when component mounts
  useEffect(() => {
    const savedAnnouncements = localStorage.getItem("announcements");
    if (savedAnnouncements) {
      setPosts(JSON.parse(savedAnnouncements));
    } else {
      // Default announcement if no saved data
      const defaultPosts = [
        {
          id: "AN-1",
          title: "Eid Office Timings",
          body: "Adjusted office timings for Eid week.",
          audience: "All",
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ];
      setPosts(defaultPosts);
      localStorage.setItem("announcements", JSON.stringify(defaultPosts));
    }
  }, []);


  // Save to localStorage whenever posts change
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem("announcements", JSON.stringify(posts));
      // Dispatch custom event to notify Dashboard
      window.dispatchEvent(new Event("announcementUpdate"));
    }
  }, [posts]);


  // Add new announcement
  const addAnnouncement = () => {
    if (!title.trim() || !body.trim()) return;
    const newPost = {
      id: `AN-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      audience: "All",
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    setPosts((prev) => [newPost, ...prev]);
    setTitle("");
    setBody("");
  };


  // Delete announcement
  const deleteAnnouncement = (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      setPosts((prev) => prev.filter((post) => post.id !== id));
    }
  };


  // Start editing
  const startEdit = (post) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditBody(post.body);
  };


  // Save edited announcement
  const saveEdit = (id) => {
    if (!editTitle.trim() || !editBody.trim()) return;
    setPosts((prev) => prev.map((post) =>
      post.id === id
        ? {
            ...post,
            title: editTitle.trim(),
            body: editBody.trim(),
            updatedAt: new Date().toISOString()
          }
        : post
    ));
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  };


  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditBody("");
  };


  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
   
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString();
    }
  };


  return (
    <div>
      <div className="pg-head">
        <div>
          <div className="pg-greet">Announcements Feed</div>
          <div className="pg-sub">Publish and read organization-wide announcements.</div>
        </div>
      </div>


      {/* Add Announcement Form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Create New Announcement</h3>
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter announcement title"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea
            className="input"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter announcement message"
          />
        </div>
        <button className="btn btn-primary" onClick={addAnnouncement}>
          Post Announcement
        </button>
      </div>


      {/* Announcements List */}
      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>
          All Announcements ({posts.length})
        </h3>
       
        {posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--t3)", padding: "40px 0" }}>
            No announcements yet. Create your first announcement above!
          </p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                padding: "16px 0",
                borderBottom: "1px solid var(--br2)",
                transition: "background 0.2s"
              }}
            >
              {editingId === post.id ? (
                // Edit Mode
                <div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Title</label>
                    <input
                      className="input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Message</label>
                    <textarea
                      className="input"
                      rows={3}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => saveEdit(post.id)}
                      style={{ padding: "6px 12px", fontSize: 14 }}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={cancelEdit}
                      style={{ padding: "6px 12px", fontSize: 14 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 8, lineHeight: 1.5 }}>
                        {post.body}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--t4)" }}>
                        {formatDate(post.timestamp)}
                        {post.updatedAt && (
                          <span style={{ marginLeft: 8 }}>• Edited</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
                      <button
                        onClick={() => startEdit(post)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--primary)",
                          fontSize: 14,
                          padding: "4px 8px"
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(post.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#dc2626",
                          fontSize: 14,
                          padding: "4px 8px"
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
