import React from "react";
import clsx from "clsx";

interface TagComponentProps {
    title: string;
    colorName: string;
    colorHex?: string; // New prop for custom color hex value
}

// Color mapping for predefined colors
const colorMap = {
    "BLUE": "#57acea",
    "ORANGE": "#ffac7e",
    "ROSE": "rgb(244, 63, 94)", // rose-500
    "GREEN": "rgb(52, 211, 153)", // emerald-400
    "PURPLE": "rgb(192, 132, 252)", // purple-400
};

const ContactTagDisplay: React.FC<TagComponentProps> = ({ 
    title, 
    colorName, 
    colorHex
}) => {
    // If a custom colorHex is provided, use it; otherwise, use the predefined color
    const tagColor = colorHex || colorMap[colorName as keyof typeof colorMap] || "#57acea";
    
    // Generate dynamic className for custom colors
    const dynamicClassName = colorHex 
        ? `p-2 rounded-sm flex-shrink-0 text-xs bg-[${tagColor}]/10 text-[${tagColor}]`
        : "";
    
    return (
        <div
            className={colorHex ? dynamicClassName : clsx("p-2 rounded-sm flex-shrink-0 text-xs", {
                "bg-[#57acea]/10 text-[#57acea]": colorName === "BLUE",
                "bg-[#ffac7e]/10 text-[#ffac7e]": colorName === "ORANGE",
                "bg-rose-500/10 text-rose-500": colorName === "ROSE",
                "bg-emerald-400/10 text-emerald-400": colorName === "GREEN",
                "bg-purple-400/10 text-purple-400": colorName === "PURPLE",
                "border-[1px] border-[#57acea]": colorName === "BLUE" && !title,
                "border-[1px] border-[#ffac7e]": colorName === "ORANGE" && !title,
                "border-[1px] border-rose-500": colorName === "ROSE" && !title,
                "border-[1px] border-emerald-400": colorName === "GREEN" && !title,
                "border-[1px] border-purple-400": colorName === "PURPLE" && !title,
            })}
            style={colorHex ? {
                backgroundColor: `${tagColor}10`, // 10% opacity
                color: tagColor,
                borderColor: tagColor
            } : {}}
        >
            {title}
        </div>
    );
};

export default ContactTagDisplay;