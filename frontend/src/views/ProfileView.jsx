import { useEffect, useState } from "react";
import api from "../api/axios";
import "../assets/css/profile.css";

export default function ProfileView({ goBack, logout }) {

  const [user, setUser] = useState(null);

  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");



  useEffect(() => {
  const loadProfile = async () => {
    try {

      setError("");
      setMessage("");

      console.log("📡 LOAD PROFILE");

      const res = await api.get("/profile/me");

      console.log("✅ PROFILE DATA:", res.data);

      const profile = res.data;

      if (!profile) {
        throw new Error("Invalid profile response");
      }

      setUser(profile);
      setUsername(profile.username || "");

    } catch (err) {

      console.error("❌ PROFILE LOAD ERROR", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load profile"
      );

    } finally {

      setLoading(false);

    }
  };

  loadProfile();
}, []);



  const updateUsername = async () => {

    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    try {

      setSavingUsername(true);
      setError("");
      setMessage("");

      console.log("📡 UPDATE USERNAME:", username);

      await api.patch("/profile/username", { username });

      setUser((prev) => ({
        ...prev,
        username
      }));

      setMessage("Username updated successfully");

    } catch (err) {

      console.error("❌ USERNAME UPDATE ERROR", err);

      setError(
        err.response?.data?.message ||
        "Unable to update username"
      );

    } finally {

      setSavingUsername(false);

    }

  };



  const updatePassword = async () => {

    if (!currentPassword || !newPassword) {
      setError("All password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters");
      return;
    }

    try {

      setSavingPassword(true);
      setError("");
      setMessage("");

      console.log("📡 UPDATE PASSWORD");

      await api.patch("/profile/password", {
        currentPassword,
        newPassword
      });

      setCurrentPassword("");
      setNewPassword("");

      setMessage("Password updated successfully");

    } catch (err) {

      console.error("❌ PASSWORD UPDATE ERROR", err);

      setError(
        err.response?.data?.message ||
        "Unable to update password"
      );

    } finally {

      setSavingPassword(false);

    }

  };



  if (loading) {
  return (
    <div className="profile-container">
      <div className="profile-card">
        <p>Loading profile...</p>
      </div>
    </div>
  );
}

if (!user) {
  return (
    <div className="profile-container">
      <div className="profile-card">
        <p>Unable to load profile</p>
        {error && <p className="profile-error">{error}</p>}
        <button onClick={goBack}>Back</button>
      </div>
    </div>
  );
}



  return (

    <div className="profile-container">

      <div className="profile-card">

        <h2>User Profile</h2>

        <div className="profile-info">

          <p>
            <strong>Username :</strong> {user.username}
          </p>

          <p>
            <strong>Role :</strong> {user.role}
          </p>

        </div>



        <div className="profile-section">

          <h3>Change Username</h3>

          <input
            type="text"
            value={username}
            placeholder="New username"
            onChange={(e) => {
  setUsername(e.target.value);
  setError("");
  setMessage("");
}}
          />

          <button
            onClick={updateUsername}
            disabled={savingUsername}
          >
            {savingUsername ? "Updating..." : "Update Username"}
          </button>

        </div>



        <div className="profile-section">

          <h3>Change Password</h3>

          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <button
            onClick={updatePassword}
            disabled={savingPassword}
          >
            {savingPassword ? "Updating..." : "Update Password"}
          </button>

        </div>



        {message && (
          <p className="profile-message">
            {message}
          </p>
        )}

        {error && (
          <p className="profile-error">
            {error}
          </p>
        )}



        <div className="profile-actions">

          <button
            className="profile-back"
            onClick={goBack}
          >
            Back
          </button>

          <button
            className="profile-logout"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </div>

    </div>

  );

}