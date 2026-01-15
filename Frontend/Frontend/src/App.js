// // App.js
// import React, { useState, useEffect } from 'react';
// import { View, Text } from 'react-native';
// import SplashScreen from './components/SplashScreen'; // Import the component

// // This is your main content component
// const MainContent = () => (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <Text style={{ fontSize: 24 }}>Welcome to the App!</Text>
//     </View>
// );

// const App = () => {
//     const [isLoading, setIsLoading] = useState(true);

//     // The logic to hide the splash screen after a delay
//     useEffect(() => {
//         // Simulate any asynchronous tasks (e.g., fetching user session, loading assets)
//         // Here, we just use a simple timer.
//         const timer = setTimeout(() => {
//             setIsLoading(false);
//         }, 3000); // 3000 milliseconds = 3 seconds delay

//         // Cleanup the timer when the component unmounts
//         return () => clearTimeout(timer);
//     }, []); // Run only once on component mount

//     // 3. Conditional Rendering
//     if (isLoading) {
//         return <SplashScreen />;
//     }

//     // Once loading is complete, show the main content
//     return <MainContent />;
// };

// export default App;