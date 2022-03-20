import { Box, CSSObject, Link } from "@chakra-ui/react";
import * as React from "react";
import { ElementType, FC } from "react";
import { NavItems, Page } from "./nav-items";

export interface SideBarProps {
    currentPath: string;
    pages: Page[];
    background?: string;
    top?: number;
    sx?: CSSObject;
    options?: {
        drawerWidth?: number;
        linkElement?: ElementType<any>;
        itemHeight?: number;
    };
}

export const SideBar: FC<SideBarProps> = ({
    pages,
    currentPath,
    top,
    options: { drawerWidth = 300, linkElement = Link, itemHeight = 34 } = {},
    children,
}) => {
    return (
        <Box
            as="nav"
            p={0}
            m={0}
            overflowY="auto"
            aria-label="folders"
            width={`${drawerWidth}px`}
            position="sticky"
            top={top}
            minHeight="100%"
        >
            {children}
            <NavItems options={{ drawerWidth, linkElement, itemHeight }} pages={pages} currentPath={currentPath} />
        </Box>
    );
};
