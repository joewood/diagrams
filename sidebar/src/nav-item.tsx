import { Text } from "@chakra-ui/react";
import * as React from "react";
import { memo } from "react";
import { NavItemsProps } from "./nav-items";

interface NavItemProps {
    link: string;
    text: string;
    icon: JSX.Element;
    options: NavItemsProps["options"];
}

export const NavItem = memo<NavItemProps>(({ link, text, icon, options }) => (
    <>
        {icon}
        <Text
            p={0}
            flex="1"
            textAlign="left"
            as={options.linkElement}
            noOfLines={1}
            to={link}
            fontWeight="bold"
            isTruncated
            _hover={{ textDecoration: "none" }}
        >
            {text}
        </Text>
    </>
));
