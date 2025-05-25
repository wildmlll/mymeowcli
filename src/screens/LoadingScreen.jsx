import { motion } from 'framer-motion';

function LoadingScreen() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-screen bg-black">
            <motion.div
                className="flex items-center text-5xl font-bold text-blue-400"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
                〜
            </motion.div>
            <motion.h1
                className="text-4xl font-bold mt-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
            >
                memeow
            </motion.h1>
        </div>
    );
}

export default LoadingScreen;