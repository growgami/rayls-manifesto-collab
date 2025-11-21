"use client";

import { useAuth } from "@/features/signing/modules/auth/hooks/useAuth.hook";

export default function AuthTestPage() {
  const { isAuthenticated, isLoading, user, twitterData, signIn, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Twitter Auth Test</h1>

        {!isAuthenticated ? (
          <div className="text-center">
            <p className="mb-6 text-gray-600">Sign in with your Twitter account to test authentication</p>
            <button
              onClick={signIn}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Sign in with Twitter
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Welcome, {user?.name}!</h2>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>

            {twitterData && (
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-medium mb-4">Twitter Profile Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID</label>
                    <p className="text-sm text-gray-900">{twitterData.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="text-sm text-gray-900">@{twitterData.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{twitterData.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-sm text-gray-900">{new Date(twitterData.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{twitterData.description || "No description"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <p className="text-sm text-gray-900">
                      {twitterData.url ? (
                        <a href={twitterData.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {twitterData.url}
                        </a>
                      ) : (
                        "No website"
                      )}
                    </p>
                  </div>
                  {twitterData.profile_image_url && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                      <img
                        src={twitterData.profile_image_url}
                        alt={`${twitterData.name}'s profile`}
                        className="w-16 h-16 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Database Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Database User ID</label>
                  <p className="text-sm text-gray-900 font-mono">
                    {user?.dbUserId ? user.dbUserId : "Not saved to database"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Persistence Status</label>
                  <p className={`text-sm font-medium ${user?.dbUserId ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.dbUserId ? "✓ User data saved to MongoDB" : "✗ User data not persisted"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium mb-4">Raw Session Data</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify({ user, twitterData }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}