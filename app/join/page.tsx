"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function JoinPage() {
    const [roomId, setRoomId] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const [isMicOn, setIsMicOn] = useState(true); // microphone state
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);
    const localMicStreamRef = useRef<MediaStream | null>(null); // save local microphone stream
    const ICE_SERVERS = [
        { urls: "stun:stun.l.google.com:19302" },
        // 一个公共的测试 TURN（不建议长期依赖），示例：
        { urls: "turn:numb.viagenie.ca:3478", username: "webrtc@live.com", credential: "muazkh" }
        // 或者你自己的 TURN：
        // { urls: "turn:turn.yourdomain.com:3478", username: "youruser", credential: "yourpass" }
    ];

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get("room");
        if (roomFromUrl) {
            setRoomId(roomFromUrl);
        }

        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (videoRef.current && activeStream) {
            videoRef.current.srcObject = activeStream;
            videoRef.current.play().catch(console.error);
        }
    }, [activeStream]);

    function joinRoom(roomIdToJoin: string = roomId) {
        if (!roomIdToJoin.trim()) {
            toast.error("Room code required", {
                description: "Please enter a valid room code."
            });
            return;
        }

        setIsConnecting(true);

        const peer = new Peer({
            debug: 2,
            config: { iceServers: ICE_SERVERS }
        });

        peerRef.current = peer;

        peer.on("open", () => {
            const connection = peer.connect(roomIdToJoin);

            connection.on("open", () => {
                toast.success("Connected!", {
                    description: "Waiting for host to share their screen..."
                });
            });

            peer.on("call", async (call) => {
                try {
                    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    localMicStreamRef.current = micStream;
                    setIsMicOn(true);

                    call.answer(micStream);

                    call.on("stream", (remoteStream) => {
                        setActiveStream(remoteStream);
                    });
                } catch {
                    call.answer();
                }
            });

            connection.on("close", () => {
                setIsConnecting(false);
                setRoomId("");
                setActiveStream(null);
                toast.error("Disconnected", {
                    description: "The session has been ended."
                });
            });
        });

        peer.on("error", (err) => {
            console.error("Peer error:", err);
            setIsConnecting(false);
            toast.error("Connection failed", {
                description: "Could not connect to the room. Please check the room code and try again."
            });
        });
    }

    function toggleMic() {
        if (!localMicStreamRef.current) return;
        localMicStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
            setIsMicOn(track.enabled);
        });
    }

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
            <Button variant="outline" asChild>
                <Link href="/" className="flex items-center self-start">
                    <ArrowLeft />
                    Back to Home
                </Link>
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users />
                        Join a Room
                    </CardTitle>
                    <CardDescription>Enter the room code to join and view the shared screen</CardDescription>
                </CardHeader>
                <CardContent>
                    {!activeStream ? (
                        <div className="flex flex-col gap-4">
                            <Input placeholder="Enter room code" value={roomId} onChange={(e) => setRoomId(e.target.value)} disabled={isConnecting} />
                            <Button className="w-full" onClick={() => joinRoom()} disabled={isConnecting || !roomId.trim()}>
                                {isConnecting ? "Connecting..." : "Join Room"}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="relative overflow-hidden rounded-lg">
                                <video ref={videoRef} className="h-full w-full object-contain" autoPlay playsInline loop controls muted />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={toggleMic}>
                                    {isMicOn ? <Mic /> : <MicOff />}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
