import { motion } from "framer-motion"; // Import motion for animations
import { ThemeProvider } from "@/components/theme-provider";

// Import From ShadCN
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Firebase imports
import { FormEvent, useState } from "react";
import { arrayUnion, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "@/config/firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import Navbar from "./components/navbar";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import infinia from "@/assets/Infinia.png";

interface TeamMembers {
    name: string;
}

interface Task {
    [x: string]: string;
    id: string;
    taskName: string;
    description: string;
    photoURL: string;
}

interface TeamData {
    teamName: string;
    teamMembers: TeamMembers[];
    tasks: Task[];
}

function App() {
    const [user, setUser] = useState(false);
    const [userID, setUserID] = useState("");
    const [teamName, setTeamName] = useState("");
    const [teamData, setTeamData] = useState<TeamData>({
        teamName: "",
        teamMembers: [
            { name: "" },
            { name: "" },
            { name: "" },
            { name: "" }
        ],
        tasks: []
    });
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [teamDataSubmitted, setTeamDataSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showRule, setShowRule] = useState(false);
    const [showRegualtions, setShowRegualtions] = useState(false);


    const handleTeamDataSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            console.log("Team data submitted:", teamData);
            await setDoc(doc(db, "teams", userID), {
                ...teamData,
                userID: userID,
                registeredAt: serverTimestamp()
            });
            setTeamDataSubmitted(true);
            // Save team data to Firestore or handle it as needed
            await fetchTasks(); // Fetch tasks after submitting team data
        } catch (error) {
            setError("Error submitting team data:");
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("An unknown error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const tasksCollection = collection(db, "tasks");
            const taskSnapshot = await getDocs(tasksCollection);
            const tasksData = taskSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    taskName: data.taskName || "",
                    description: data.description || "",
                    photoURL: data.photoURL || null
                };
            });
            setTasks(tasksData);
        } catch (error) {
            setError("Error submitting team data:");
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("An unknown error occurred");
            }
        }
    };

    const handleInputChange = (index: number, field: keyof TeamMembers, value: string) => {
        const updatedMembers = [...teamData.teamMembers];
        updatedMembers[index] = { ...updatedMembers[index], [field]: value };
        setTeamData({ ...teamData, teamMembers: updatedMembers });
    };

    // Login
    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const target = e.target as typeof e.target & {
            loginEmail: { value: string };
            loginPassword: { value: string };
        };

        const email = target.loginEmail.value;
        const password = target.loginPassword.value;

        try {
            // Handle login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const loggedInUser = userCredential.user.uid;
            setUserID(loggedInUser);
            setUser(true);  // Assuming `user` indicates login status
            console.log("Logged In User ID:", loggedInUser);
            setMessage("Login successful!");
            checkData(loggedInUser);
        } catch (error) {
            setError("Error logging in:");
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("An unknown error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Register
    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const target = e.target as typeof e.target & {
            registerEmail: { value: string };
            registerPassword: { value: string };
            confirmPassword: { value: string };
        };
    
        const email = target.registerEmail.value;
        const password = target.registerPassword.value;
        const confirmPassword = target.confirmPassword.value;
    
        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }
    
        try {
            // Firebase create user logic
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const registeredUser = userCredential.user.uid;
    
            // Update the user state or redirect
            setUserID(registeredUser);
            setUser(true);  // Assuming `user` indicates login status
            setMessage("Registration successful!");
    
            console.log("Registered User ID:", registeredUser);
        } catch (error) {
            if (error instanceof Error) {
                setError("Error registering user");
                setMessage(error.message);
            } else {
                setMessage("An unknown error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSignOut = async () => {
        setUserID("");
        setUser(false);
        setTeamDataSubmitted(false);
        setTeamData({
            teamName: "",
            teamMembers: [
                { name: "" },
                { name: "" },
                { name: "" },
                { name: "" }
            ],
            tasks: []
        });
        setTasks([]);
        setError("");
        setMessage("");
        setIsLoading(false);
    }

    const checkData = async (id: string) => {
        const docRef = doc(db, "teams", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            setTeamName(docSnap.data().teamName);
            setTeamData(docSnap.data() as TeamData);
            setTeamDataSubmitted(true);
            await fetchTasks();
        } else {
            console.log("No such document!");
        }
    }

    // Upload Image + Data
    const uploadTaskData = async (teamName: string, taskId: string, imageFile: File) => {
        try {
            const storageRef = ref(storage, `team_images/${teamName}/${taskId}`);
            const snapshot = await uploadBytes(storageRef, imageFile);        
            const imageUrl = await getDownloadURL(snapshot.ref);
            const teamDocRef = doc(db, "teams", userID); // Reference to the team document

            const timestamp = new Date().toISOString(); 
        
            await updateDoc(teamDocRef, {
                tasks: arrayUnion({ taskId, imageUrl, timestamp }) // Add the new task without overwriting the array
            });
        } catch (error) {
          console.error("Error uploading task data:", error);
          throw new Error("Failed to upload task data");
        }
    };


    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        }
    }

    const handleUpload = async (taskID: string) => {
        if (!selectedFile) {
          alert("Please select an image file before uploading.");
          return;
        }
    
        try {
          const uploadedData = await uploadTaskData(teamName, taskID, selectedFile);
          console.log("Uploaded data:", uploadedData);
          alert("File uploaded successfully!");
        } catch (error) {
          console.error("Error uploading file:", error);
          alert("File upload failed.");
        }
    };

    const handleShowRule = () => {
        setShowRule(true);
        setShowRegualtions(false);
    }

    const handleShowRegulation = () => {
        setShowRule(true);
        setShowRegualtions(false);
    }

    const close = () => {
        setShowRule(false);
        setShowRegualtions(false);
    }
    
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            {userID && ( <Navbar onSignOut={handleSignOut} /> )}
            <div className="flex justify-center items-center gap-4 py-2">
                <Button onClick={handleShowRule}>
                    {showRule ? "Hide": "Show Rules"}
                </Button>
                <Button onClick={handleShowRegulation}>
                    {showRegualtions ? "Hide" : "How To Play?"}
                </Button>
                {(showRule || showRegualtions) && (
                    <Button onClick={close}>Close</Button>
                )}
            </div>
            {showRule && (
                <div className="flex justify-center">
                    <h3>Rules & Regulations</h3>
                    <ol className="list-disc">
                        <li>Team leaders are responsible for all actions of their respective teams.</li>
                        <li>All participants must complete the hunt within the time frame. Late arrivals will not be allowed additional time.</li>
                        <li>Participants must use the designated AR app to find and unlock clues.</li>
                        <li>All clues must be solved in sequence. Skipping clues is not allowed.</li>
                        <li>Do not tamper with other team’s clues, otherwise leads to a review or disqualification.</li>
                        <li>Collaborating with other teams or participants outside your registered team is prohibited.</li>
                        <li>Any form of cheating, including sharing answers, will result in immediate disqualification.</li>
                        <li>Teams are allowed to use their smartphones to solve AR clues and internet to solve all puzzles and riddles.</li>
                        <li>Please follow all event venue guidelines. Do not damage or disturb any property or individuals during the hunt.</li>
                        <li>Clues will be located in public areas. Do not attempt to access restricted locations.</li>
                        <li>The winning team will be the first to complete the hunt by solving all clues correctly or have the most keys attained within the time limit.</li>
                        <li>In case of a tie, the team with the fastest overall completion time will be declared the winner.</li>
                        <li>Participants must prioritize safety at all times.</li>
                        <li>The event organizers reserve the right to modify the rules, disqualify teams for violations, or halt the event in case of unforeseen circumstances.</li>
                        <li>All decisions made by the organizers are final and binding.</li>
                    </ol>
                </div>
            )}
            {showRegualtions && (
                <div className="flex justify-center">
                    <h3>How To Play?</h3>
                    <ol className="list-disc">
                        <li>This Treasure hunt constitutes puzzles and riddles that teams must get through together to complete 3 levels in the form of AR keys - Copper Key, Jade Key and Crystal Key respectively.</li>
                        <li>The teams will be given curated and unique envelopes containing the materials that have all the clues required to reach the end. Do not try to go astray from the given clues.</li>
                        <li>Only follow the clues indicated in the materials to ensure concluding the event and failure to means that you are going down the wrong path.</li>
                        <li>Clues will be revealed from cards at various physical locations through the AR app. Teams must find each key to progress to the next level.</li>
                        <li>A website along with preset login details will be given to the team leader to upload the screenshots of each key.</li>
                        <li>A validation process will be done after uploading to ensure you got the correct combination of keys and images, and allows us to check if you are on the right pathway curated to your team.</li>
                        <li>Ending of each level requires you to find printed images that, when scanned through the AR applications, gives the respective level keys that must be screenshot and uploaded to the given website.</li>
                        <li>The team leader will be given the .apk file for the AR application. Make sure that it is properly installed in your chosen device or seek guidance from your assigned organizer.</li>
                        <li>Ensure your smartphone or tablet is fully charged before the event. A portable charger is recommended in case your device runs low on battery.</li>
                        <li>Try to use devices with Android 11 or higher. The more updated the device, the better. iOS devices are not supported.</li>
                        <li>Time - Might be subject to changes:
                            <ol type="a">
                            <li>5:00 PM to 6:30 PM ~ Sat 28 Sep</li>
                            <li>9:00 AM to 3:00 PM ~ Sun 29 Sep</li>
                            </ol>
                        </li>
                        <li>Free roam to find clues is allowed only for the participants within the given area limits.</li>
                        <li>Check the WhatsApp group often to receive updates first.</li>
                    </ol>
                </div>
            )}
            <div className="p-6 flex flex-col justify-center items-center min-h-screen w-full bg-gray-900 text-white">
                {!user ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Card className="w-[350px]">
                            <CardHeader className="space-x-1">
                                <div className="flex justify-center items-center">
                                    <img src={infinia} alt="Infinia Logo" className="object-fit h-16" />
                                </div>
                                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                                <CardDescription>Enter your email to sign in or create an account</CardDescription>
                            </CardHeader>
                            <Tabs defaultValue="login" className="w-full">
                                <div className="px-6 pb-6">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="login">Login</TabsTrigger>
                                        <TabsTrigger value="register">Register</TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Login Form with animation */}
                                <TabsContent value="login">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <form onSubmit={handleLogin}>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="loginEmail">Email</Label>
                                                    <Input type="email" id="loginEmail" placeholder="john@gmail.com" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="loginPassword">Password</Label>
                                                    <Input type="password" id="loginPassword" placeholder="********" required />
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                <Button className="w-full" type="submit" disabled={isLoading}>
                                                    {isLoading ? "Signing In..." : "Sign In"}
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </motion.div>
                                </TabsContent>

                                {/* Registration Form with animation */}
                                <TabsContent value="register">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <form onSubmit={handleRegister}>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="registerEmail">Email</Label>
                                                    <Input type="email" id="registerEmail" placeholder="john@gmail.com" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="registerPassword">Password</Label>
                                                    <Input type="password" id="registerPassword" placeholder="********" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                                    <Input type="password" id="confirmPassword" placeholder="********" required />
                                                </div>
                                            </CardContent>
                                            <CardFooter>
                                                <Button className="w-full" type="submit" disabled={isLoading}>
                                                    {isLoading ? "Registering..." : "Register"}
                                                </Button>
                                            </CardFooter>
                                        </form>
                                    </motion.div>
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </motion.div>
                ) : (
                    <>
                        {!teamDataSubmitted ? (
                            <motion.form onSubmit={handleTeamDataSubmit} className="border dark:border-gray-700 p-5 rounded-3xl gap-6 shadow-lg bg-gray-800" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                                <div className="flex justify-center items-center">
                                    <img src={infinia} alt="Infinia Logo" className="object-fit h-16" />
                                </div>
                                <h2 className="text-center text-4xl mb-6">Enter Team Details</h2>
                                <div className="mb-4">
                                    <label className="block text-xl mb-1">Team Name:</label>
                                    <Input type="text" value={teamData.teamName} onChange={(e) => setTeamData({ ...teamData, teamName: e.target.value })} className="w-full border-b border-gray-400 focus:border-blue-500 bg-transparent" required />
                                </div>
                                {teamData.teamMembers.map((member, index) => (
                                    <div key={index} className="flex flex-col mb-4">
                                        <h3 className="text-lg font-semibold">Member {index + 1}</h3>
                                        <div className="flex gap-4 ml-5">
                                            <div>
                                                <label className="block text-md mb-1">Name:</label>
                                                <Input type="text" value={member.name} onChange={(e) => handleInputChange(index, "name", e.target.value)} className="w-full border-b border-gray-400 focus:border-blue-500 bg-transparent" required />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                                    {isLoading ? "Submitting..." : "Submit Team Data"}
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }}>
                                <div className="flex justify-center items-center">
                                    <img src={infinia} alt="Infinia Logo" className="object-fit h-16" />
                                </div>
                                <h2 className="text-3xl mb-6">Your Tasks</h2>
                                {tasks.length > 0 ? (
                                    tasks
                                        .filter(task => !teamData.tasks.some(teamTask => teamTask.taskId === task.id))
                                        .reverse()
                                        .map(task => (
                                            <motion.div key={task.id} className="task bg-gray-800 p-4 mb-4 rounded-lg shadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} >
                                                <h3 className="text-center text-2xl mb-2">{task.taskName}</h3>
                                                <p className="mb-4">{task.description}</p>

                                                {/* File input to select an image */}
                                                <Input type="file" accept="image/*" className="w-full border-b border-gray-400 focus:border-blue-500 bg-transparent" onChange={(e) => handleFileChange(e)} />

                                                {/* Upload button to trigger the upload */}
                                                <Button className="w-full mt-2" onClick={() => handleUpload(task.id)} disabled={isLoading}>
                                                    {isLoading ? "Uploading..." : "Upload Image"}
                                                </Button>
                                            </motion.div>
                                        ))
                                ) : (
                                    <p>No tasks available.</p>
                                )}
                                {error && <p className="text-red-500">{message}</p>}
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </ThemeProvider>
    );
}


export default App;
