// src/screens/LoadingScreen.jsx
function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black">
            <div className="text-6xl font-bold text-gradient-violet mb-6">~</div>
            <p className="text-sm font-medium text-gray-400">Loading...</p>
        </div>
    );
}

export default LoadingScreen;