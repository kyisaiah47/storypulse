"use client";
import React from "react";

const BackgroundBlobs: React.FC = () => (
	<>
		<div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-indigo-400 opacity-20 rounded-full blur-3xl animate-pulse z-0" />
		<div className="absolute top-1/2 right-0 w-[300px] h-[300px] bg-fuchsia-400 opacity-10 rounded-full blur-2xl animate-pulse z-0" />
		<div className="absolute bottom-0 left-1/2 w-[350px] h-[350px] bg-sky-400 opacity-10 rounded-full blur-2xl animate-pulse z-0" />
	</>
);

export default BackgroundBlobs;
