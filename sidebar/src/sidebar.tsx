import { Box, CSSObject, Link } from "@chakra-ui/react";
import * as React from "react";
import { ElementType, FC } from "react";
import { NavItems, Page } from "./nav-items";

export interface SideBarProps {
    currentPath?: string;
    pages: Page[];
    sx?: CSSObject;
    options?: {
        drawerWidth?: number;
        highlightColor?: string;
        linkElement?: ElementType<any>;
        color?: string;
        topOffset?: number;
        itemHeight?: number;
        backgroundColor?: string;
    };
}

export const SideBar: FC<SideBarProps> = ({
    pages,
    currentPath,
    options: {
        drawerWidth = 300,
        highlightColor = "#ccc",
        linkElement = Link,
        itemHeight = 34,
        color = "black",
        topOffset = 0,
        backgroundColor = "#e0e0e0",
    } = {},
    children,
    sx,
}) => {
    currentPath = currentPath ?? window.location.pathname;
    return (
        <Box
            as="nav"
            p={0}
            m={0}
            left={0}
            position="absolute"
            overflowY="scroll"
            aria-label="folders"
            bg={backgroundColor}
            width={`${drawerWidth}px`}
            top={`${topOffset}px`}
            minHeight={`calc( 100% - ${topOffset}px )`}
            sx={sx}
        >
            {children}
            <NavItems
                options={{ highlightColor, drawerWidth, linkElement, topOffset, color, itemHeight, backgroundColor }}
                pages={pages}
                currentPath={currentPath}
            />
        </Box>
    );
};
