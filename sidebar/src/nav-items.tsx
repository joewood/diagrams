import { InfoOutlineIcon, PlusSquareIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Flex,
    useColorModeValue,
} from "@chakra-ui/react";
import { isEqual, kebabCase, uniq } from "lodash";
import * as React from "react";
import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";
import { NavItem } from "./nav-item";
import { SideBarProps } from "./sidebar";

function findIndexIntoPages(currentPath: string, parentPath: string , subPages: Page[]) {
    if ( !currentPath || !currentPath.startsWith(parentPath)) return -1;
    return subPages.findIndex((subPage) => currentPath.startsWith(`${parentPath}/${subPage.pathPart}`));
}

function useNavigationState(currentPath: string, pages: Page[], parentPath: string ) {
    const index = useMemo(() => findIndexIntoPages(currentPath, parentPath, pages), [currentPath, pages, parentPath]);
    const [indices, setIndices] = useState<number[]>(index < 0 ? [] : [index]);
    useEffect(() => {
        if (index >= 0)
            setIndices((previousIndices) => {
                const sortedIndices = uniq([...previousIndices, index]).sort((a, b) => a - b);
                return isEqual(sortedIndices, previousIndices) ? previousIndices : sortedIndices;
            });
    }, [index]);
    return [indices, setIndices] as [typeof indices, typeof setIndices];
}

export interface Page {
    subPages?: Page[] | JSX.Element;
    name: string;
    pathPart?: string | null;
    icon?: JSX.Element;
}

export interface NavItemsProps {
    currentPath: string;
    parentPath?: string ;
    pages: Page[];
    options: Required<Required<SideBarProps>["options"]>;
}

export const NavItems: FC<NavItemsProps> = memo<NavItemsProps>(({ currentPath, pages, parentPath = "", options }) => {
    const [navState, setNavState] = useNavigationState(currentPath, pages, parentPath);
    const defaultedPages = useMemo(
        () =>
            pages.map((p) => ({
                name: p.name,
                subPages: !p.subPages || !Array.isArray(p.subPages) ? [] : p.subPages,
                pathPart: p.pathPart === null ? null : p.pathPart ?? kebabCase(p.name),
                icon:
                    p.icon ?? (!Array.isArray(p.subPages) || (p.subPages?.length ?? 0) > 0) ? (
                        <PlusSquareIcon />
                    ) : (
                        <InfoOutlineIcon />
                    ),
            })),
        [pages]
    );
    const onChange = useCallback(
        (ind: number[]) => {
            const sortedIndices = uniq(ind).sort((a, b) => a - b);
            setNavState((previousIndices) =>
                isEqual(previousIndices, sortedIndices) ? previousIndices : sortedIndices
            );
        },
        [setNavState]
    );
    const hoverColor = useColorModeValue("gray.100", "gray.700");
    const selectedBackgroundColor = useColorModeValue("gray.800", "gray.200");
    const selectedColor = useColorModeValue("gray.100", "gray.800");
    return (
        <Accordion
            p={0}
            m={0}
            allowMultiple
            allowToggle
            index={navState}
            onChange={onChange}
            maxWidth={`${options.drawerWidth}px`}
        >
            {defaultedPages.map((page) => {
                const pagePath = page.pathPart === null ? "---" : `${parentPath}/${page.pathPart}`;
                return (
                    <AccordionItem key={page.pathPart} p={0} isFocusable={false} borderColor="transparent">
                        <AccordionButton
                            padding="4px 0 0 0"
                            as={Flex}
                            fontSize={14}
                            sx={{
                                "& > svg:first-of-type": {
                                    marginLeft: 2,
                                    flex: "0 0 auto",
                                    marginRight: 2,
                                },
                            }}
                            backgroundColor={currentPath === pagePath ? selectedBackgroundColor : undefined}
                            color={currentPath === pagePath ? selectedColor : undefined}
                            _selected={{ backgroundColor: selectedBackgroundColor, color: selectedColor }}
                            _hover={{
                                backgroundColor: currentPath === pagePath ? selectedBackgroundColor : hoverColor,
                            }}
                            direction="row"
                            height={options.itemHeight}
                            alignItems="center"
                        >
                            <NavItem
                                link={pagePath === null ? "" : pagePath}
                                text={page.name}
                                icon={page.icon}
                                options={options}
                            />
                            {page.subPages && (!Array.isArray(page.subPages) || page.subPages.length > 0) && (
                                <AccordionIcon />
                            )}
                        </AccordionButton>
                        <AccordionPanel p={0} pl="10px">
                            {Array.isArray(page.subPages) && page.subPages.length > 0 ? (
                                <NavItems
                                    pages={page.subPages}
                                    parentPath={pagePath}
                                    currentPath={currentPath}
                                    options={options}
                                />
                            ) : (
                                page.subPages
                            )}
                        </AccordionPanel>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
});
