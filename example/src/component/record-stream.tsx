import * as React from "react";
export const TTT=3;

// import { useState, FC, useRef, useCallback } from "react";

// interface RecordProps {
//     filename: string;
// }

// declare global {
//     export interface MediaDevices {
//         getDisplayMedia(x: MediaStreamConstraints): Promise<MediaStream>;
//     }
// }

// export const RecordStream: FC<RecordProps> = ({ filename }) => {
//     const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
//     const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
//     const videoRef = useRef<HTMLVideoElement | null>(null);
//     const onsStart = useCallback(() => {
//         async function doit() {
//             const recData: Blob[] = [];
//             const stream = await navigator.mediaDevices.getDisplayMedia({
//                 video: true,
//                 audio: true,
//             });
//             videoRef.current!.srcObject = stream;
//             const currRec = new MediaRecorder(stream, {
//                 mimeType: 'video/webm;codecs="vp8,opus"',
//             });
//             currRec.ondataavailable = (e) => recData.push(e.data);
//             currRec.onstop = () => {
//                 const blob = new Blob(recData, { type: recData[0].type });
//                 setDownloadUrl(URL.createObjectURL(blob));
//             };
//             currRec.start();
//             setRecorder(currRec);
//             return null;
//         }
//         if (videoRef.current) doit();
//     }, [videoRef]);
//     const onStop = useCallback(() => recorder && recorder.stop(), [recorder]);
//     return (
//         <div style={{ padding: 2, backgroundColor: "#303030", width: 120 }}>
//             <video
//                 style={{ display: "hidden", width: 1, height: 1 }}
//                 ref={videoRef}
//             />
//             {downloadUrl ? (
//                 <a href={downloadUrl} download={filename + ".webm"}>
//                     Click to Download
//                 </a>
//             ) : !recorder ? (
//                 <button onClick={onsStart}>Start Recording</button>
//             ) : (
//                 <button onClick={onStop}>Stop Recording</button>
//             )}
//         </div>
//     );
// };
