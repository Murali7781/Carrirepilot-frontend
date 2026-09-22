export default function ProfileSnapshot({ profile }) {
  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>Profile snapshot</h3>
      </div>
      {profile ? (
        <div className="profile-summary">
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Mobile:</strong> {profile.mobile || 'Not added'}</p>
          <p><strong>Member since:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>No profile data yet.</p>
      )}
    </div>
  );
}
