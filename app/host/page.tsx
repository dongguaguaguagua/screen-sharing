"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Monitor, Users, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Peer from "peerjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShareOptions } from "./_components/share-options";

export default function HostPage() {
    const [roomId, setRoomId] = useState("");
    const [peer, setPeer] = useState<Peer | null>(null);
    const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
    const [connections, setConnections] = useState<string[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const customRoomId = searchParams.get("room");
    const [isMicOn, setIsMicOn] = useState(true);

    const ICE_SERVERS = [
        { urls: "stun:stun.l.google.com:19302" },
        // 一个公共的测试 TURN（不建议长期依赖），示例：
        { urls: "turn:numb.viagenie.ca:3478", username: "webrtc@live.com", credential: "muazkh" }
        // 或者你自己的 TURN：
        // { urls: "turn:turn.yourdomain.com:3478", username: "youruser", credential: "yourpass" }
    ];
    useEffect(() => {
        try {
            const newPeer = customRoomId
                ? new Peer(customRoomId, {
                      debug: 2,
                      config: { iceServers: ICE_SERVERS }
                  })
                : new Peer({
                      debug: 2,
                      config: { iceServers: ICE_SERVERS }
                  });
            setPeer(newPeer);

            newPeer.on("open", (id) => {
                setRoomId(id);
            });

            newPeer.on("error", (err) => {
                toast.error("Failed to create room", {
                    description: err.message
                });
                router.push("/");
            });

            newPeer.on("connection", (connection) => {
                setConnections((prev) => [...prev, connection.peer]);
                connection.on("close", () => {
                    setConnections((prev) => prev.filter((peerId) => peerId !== connection.peer));
                });
            });

            return () => {
                newPeer.destroy();
            };
        } catch (error) {
            console.error("Error initializing peer:", error);
            toast.error("Failed to create room", {
                description: "Please try again."
            });
            router.push("/");
        }
    }, [customRoomId]);

    useEffect(() => {
        if (!peer) return;

        if (!activeStream && connections.length > 0) {
            toast.info("New viewer connected", {
                description: "Click to start sharing your screen.",
                duration: Infinity,
                action: {
                    label: "Start Sharing",
                    onClick: async () => startSharing()
                }
            });
        } else if (activeStream) {
            connections.forEach((connection) => {
                const call = peer.call(connection, activeStream);
                activeStream.getTracks()[0].onended = () => {
                    call.close();
                    activeStream.getTracks().forEach((track) => track.stop());
                };
            });
        }
    }, [peer, activeStream, connections]);

    function endSession() {
        if (activeStream) {
            activeStream.getTracks().forEach((track) => track.stop());
            setActiveStream(null);
        }
        if (peer) {
            peer.destroy();
            setPeer(null);
        }
        setConnections([]);
        setRoomId("");
        toast.info("Session ended", {
            description: "Your screen sharing session has been terminated."
        });
        router.push("/");
    }

    async function startSharing() {
        try {
            // screen
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            // microphone
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // combine channels
            const combinedStream = new MediaStream([...screenStream.getVideoTracks(), ...screenStream.getAudioTracks(), ...micStream.getAudioTracks()]);

            setActiveStream(combinedStream);

            connections.forEach((connectionId) => {
                const call = peer!.call(connectionId, combinedStream);

                screenStream.getVideoTracks()[0].onended = () => {
                    call.close();
                    combinedStream.getTracks().forEach((t) => t.stop());
                    setActiveStream(null);
                };
            });
        } catch (err) {
            console.error("Screen sharing error:", err);
            toast.error("Screen sharing error", {
                description: "Failed to start screen sharing. Please try again."
            });
        }
    }

    function toggleMic() {
        if (!activeStream) return;
        activeStream.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
            setIsMicOn(track.enabled);
        });
    }

    return (
        <div className="px-4 py-8">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
                <Button variant="outline" asChild>
                    <Link href="/" className="flex items-center self-start">
                        <ArrowLeft />
                        Back to Home
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor />
                            Your Screen Sharing Room
                        </CardTitle>
                        <CardDescription>Share your room code or link with others to let them view your screen. To share audio as well, ensure you're using Chrome or Edge, and select the option to share a tab.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <ShareOptions roomId={roomId} />
                        <div className="bg-muted/50 flex items-center justify-between rounded-lg p-4">
                            <div className="text-muted-foreground flex items-center gap-2">
                                <Users className="size-4" />
                                <span className="text-sm">Current Viewers</span>
                            </div>
                            <span className="text-lg font-semibold">{connections.length}</span>
                        </div>
                        {activeStream && (
                            <div className="flex gap-2 self-end">
                                <Button variant="secondary" onClick={toggleMic}>
                                    {isMicOn ? <Mic /> : <MicOff />}
                                </Button>
                                <Button variant="destructive" onClick={endSession}>
                                    Stop sharing
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
