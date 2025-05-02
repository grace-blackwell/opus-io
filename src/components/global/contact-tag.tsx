import React from "react";
import clsx from "clsx";

interface TagComponentProps {
    title: string;
    colorName: string;
    selectedColor?: (color: string) => void;
    colorHex?: string; // New prop for custom color hex value
    onClick?: () => void; // New prop for handling click events
}

// Color mapping for predefined colors
const colorMap = {
    "BLUE": "#57acea",
    "ORANGE": "#ffac7e",
    "ROSE": "rgb(244, 63, 94)", // rose-500
    "GREEN": "rgb(52, 211, 153)", // emerald-400
    "PURPLE": "rgb(192, 132, 252)", // purple-400
};

const ContactTagComponent: React.FC<TagComponentProps> = ({ 
    title, 
    colorName, 
    selectedColor,
    colorHex,
    onClick
}) => {
    // If a custom colorHex is provided, use it; otherwise, use the predefined color
    const tagColor = colorHex || colorMap[colorName as keyof typeof colorMap] || "#57acea";
    
    // Generate dynamic className for custom colors
    const dynamicClassName = colorHex 
        ? `p-2 rounded-sm flex-shrink-0 text-xs cursor-pointer bg-[${tagColor}]/80 text-[${tagColor}]`
        : "";
    
    return (
        <div
            className={colorHex ? dynamicClassName : clsx("p-2 rounded-sm flex-shrink-0 text-xs cursor-pointer", {
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
            } : {}}
            key={colorName}
            onClick={(e) => {
                if (onClick) {
                    onClick();
                } else if (selectedColor) {
                    selectedColor(colorName);
                }
            }}
        >
            {title}
        </div>
    );
};

export default ContactTagComponent;