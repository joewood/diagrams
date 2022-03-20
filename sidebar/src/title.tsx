import { Box, Button, Flex, Heading, useColorMode } from "@chakra-ui/react";
import * as React from "react";
import { FC } from "react";

export interface TitleProps {
    title: string;
    subtitle?: string;
    navHeight?: number;
}

export const Title: FC<TitleProps> = ({ title, subtitle, navHeight = 40 }) => {
    const { colorMode, toggleColorMode } = useColorMode();
    return (
        <Flex as="header" width="100%" justifyContent="space-between" height={`${navHeight}px`} alignItems="center">
            <Heading size="md" pr={4} pl={2}>
                {title}
            </Heading>
            <Heading size="sm">{subtitle}</Heading>
            <Button
                flex="0 0 auto"
                onClick={toggleColorMode}
                m={2}
                variant="outline"
                height={`${navHeight * 0.8}px`}
                size="xs"
            >
                {`${colorMode === "dark" ? "Light" : "Dark"} Mode`}
            </Button>
        </Flex>
    );
};
