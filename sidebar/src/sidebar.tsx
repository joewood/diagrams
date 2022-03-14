import { Box, CSSObject, Link } from "@chakra-ui/react";
import { StyleFunctionProps } from "@chakra-ui/theme-tools";
import * as React from "react";
import { ElementType, FC } from "react";
import { NavItems, Page } from "./nav-items";

const components = {
    SideBar: {
        baseStyle: ({ colorMode }: StyleFunctionProps) => ({
            bg: colorMode === "dark" ? "gray.100" : "gray.800",
            color: colorMode === "dark" ? "gray.800" : "gray.100",
        }),
    },
};

export interface SideBarProps {
    currentPath: string;
    pages: Page[];
    sx?: CSSObject;
    options?: {
        drawerWidth?: number;
        // highlightColor?: string;
        linkElement?: ElementType<any>;
        // color?: string;
        itemHeight?: number;
        // backgroundColor?: string;
    };
}

export const SideBar: FC<SideBarProps> = ({
    pages,
    currentPath,
    options: { drawerWidth = 300,  linkElement = Link, itemHeight = 34 } = {},
    children,
    sx,
}) => {
    // const style = useStyleConfig("SideBar");
    return (
        <Box
            as="nav"
            p={0}
            m={0}
            overflowY="auto"
            aria-label="folders"
            width={`${drawerWidth}px`}
            minHeight={`100%`}
        >
            {children}
            <NavItems
                options={{  drawerWidth, linkElement,  itemHeight }}
                pages={pages}
                currentPath={currentPath}
            />
        </Box>
    );
};
