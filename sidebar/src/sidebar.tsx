import { Box, CSSObject, Link } from "@chakra-ui/react";
import * as React from "react";
import { ElementType, FC } from "react";
import { NavItems, Page } from "./nav-items";

export interface SideBarProps {
    currentPath: string;
    pages: Page[];
    sx?: CSSObject;
    options?: {
        drawerWidth?: number;
        highlightColor?: string;
        linkElement?: ElementType<any>;
        color?: string;
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
        backgroundColor = "#e0e0e0",
    } = {},
    children,
    sx,
}) => (
    <Box
        as="nav"
        p={0}
        m={0}
        overflowY="auto"
        aria-label="folders"
        bg={backgroundColor}
        width={`${drawerWidth}px`}
        minHeight={`100%`}
        sx={sx}
    >
        {children}
        <NavItems
            options={{ highlightColor, drawerWidth, linkElement, color, itemHeight, backgroundColor }}
            pages={pages}
            currentPath={currentPath}
        />
    </Box>
);
