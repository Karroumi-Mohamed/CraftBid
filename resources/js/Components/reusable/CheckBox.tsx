import { useState } from "react";

interface CheckBoxProps {
    onChange?: (checked: boolean) => void;
    round?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
    size?: "small" | "medium" | "big" | "large";
    color?: string;
    checked?: boolean;
}

export default function CheckBox(props: CheckBoxProps) {

    const [checked, setChecked] = useState(props.checked || false);

    const handleCheck = () => {
        if (props.onChange) {
            props.onChange(!checked);
            setChecked(!checked);
        }
    };

    const sizes = {
        small: "w-4 h-4 border-[1px]",
        medium: "w-5 h-5 border-[1px]",
        big: "w-6 h-6 border-[2px]",
        large: "w-7 h-7 border-[2px]",
    };
    
    const shadow = {
        small: "0 0 0 1px " + props.color,
        medium: "0 0 0 1px " + props.color,
        big: "0 0 0 2px " + props.color,
        large: "0 0 0 2px " + props.color,
    }

    const innerSizes = {
        small: "w-8 h-8",
        medium: "w-9 h-9",
        big: "w-10 h-10",
        large: "w-11 h-11",
    }

    const sizeClass = sizes[props.size || "medium"];
    const innerSizeClass = innerSizes[props.size || "medium"];
    const roundClass = `rounded-${props.round || "none"}`;
    const color = props.color || "black";
    return (
        <label
            className={`block cursor-pointer ${sizeClass}  border-transparent ${roundClass} ${"shadow-["+ color +"]"} relative overflow-hidden`}
            onClick={() => { handleCheck() }}
            style={{ boxShadow: shadow[props.size || "medium"] }}
        >
            <div
                className={`duration-200 ease-in-out ${roundClass} ${innerSizeClass} absolute z-50 rotate-z-45 transform transition-transform ${checked ? ' rotate-0 -translate-x-1 -translate-y-1' : '  rotate-45 translate-x-full translate-y-full'} `}
                style={{ backgroundColor: color}}
            ></div>
        </label>
    );
}

