import { useRef, useEffect, useState } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Loader2, Camera, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FocusCameraProps {
    onStatusChange: (status: 'active' | 'face_lost' | 'eyes_away') => void;
    isActive: boolean;
}

export const FocusCamera = ({ onStatusChange, isActive }: FocusCameraProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const requestRef = useRef<number>();
    const lastStatusRef = useRef<string>("active");
    const { toast } = useToast();

    useEffect(() => {
        const loadModel = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
                );

                landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });

                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to load MediaPipe model:", error);
                toast({ title: "Vision AI Error", description: "Failed to load face tracking model.", variant: "destructive" });
            }
        };

        loadModel();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isActive && isLoaded) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, isLoaded]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.addEventListener("loadeddata", predictWebcam);
                setHasPermission(true);
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            toast({ title: "Camera Blocked", description: "Enable camera access for Focus AI.", variant: "destructive" });
            setHasPermission(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
        }
    };

    const predictWebcam = async () => {
        if (!landmarkerRef.current || !videoRef.current) return;

        const startTimeMs = performance.now();
        try {
            const result = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

            // Simple Logic: Face Present?
            if (result.faceLandmarks.length > 0) {
                updateStatus('active');
            } else {
                updateStatus('face_lost');
            }
        } catch (e) {
            // console.warn("Detection warning:", e);
        }

        if (isActive) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    };

    const updateStatus = (status: 'active' | 'face_lost' | 'eyes_away') => {
        if (lastStatusRef.current !== status) {
            onStatusChange(status);
            lastStatusRef.current = status;
        }
    };

    if (!isActive) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-primary/20 bg-black/80 w-40 h-30 transition-all hover:scale-105">
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                )}
                {!hasPermission && isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-destructive">
                        <CameraOff className="w-6 h-6" />
                    </div>
                )}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform scale-x-[-1] ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
                />
                <div className="absolute top-1 left-2 flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${isLoaded && hasPermission ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-mono text-white/80 uppercase">FocusVision</span>
                </div>
            </div>
        </div>
    );
};
