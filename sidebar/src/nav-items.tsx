import { InfoOutlineIcon, PlusSquareIcon } from "@chakra-ui/icons";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Flex } from "@chakra-ui/react";
import { isEqual, uniq } from "lodash";
import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { NavItem } from "./nav-item";
import { SideBarProps } from "./sidebar";

function findIndexIntoPages(currentPath: string, parentPath: string, subPages: Page[]) {
    if (!currentPath || !currentPath.startsWith(parentPath)) return -1;
    return subPages.findIndex((subPage) => currentPath.startsWith(`${parentPath}/${subPage.pathPart}`));
}

function useNavigationState(activePath: string, pages: Page[], parentPath: string) {
    const index = useMemo(() => findIndexIntoPages(activePath, parentPath, pages), [activePath, pages, parentPath]);
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
    subPages?: Page[];
    name: string;
    pathPart?: string;
    icon?: JSX.Element;
}

export interface NavItemsProps {
    currentPath: string;
    parentPath?: string;
    pages: Page[];
    options: Required<Required<SideBarProps>["options"]>;
}

export const NavItems: FC<NavItemsProps> = ({ currentPath, pages, parentPath = "", options }) => {
    const [navState, setNavState] = useNavigationState(currentPath, pages, parentPath);
    const defaultedPages = useMemo(
        () =>
            pages.map((p) => ({
                name: p.name,
                subPages: p.subPages ?? [],
                pathPart: p.pathPart ?? encodeURIComponent(p.name.toLowerCase()),
                icon: p.icon ?? (p.subPages?.length ?? 0) > 0 ? <PlusSquareIcon /> : <InfoOutlineIcon />,
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
                const pagePath = `${parentPath}/${page.pathPart}`;
                return (
                    <AccordionItem
                        key={page.pathPart}
                        p={0}
                        isFocusable={false}
                        borderColor="transparent"
                        color={options.color}
                    >
                        <AccordionButton
                            padding="4px 0 0 0"
                            bg={currentPath === pagePath ? options.highlightColor : "transparent"}
                            as={Flex}
                            fontSize={14}
                            sx={{
                                "& > *:first-child": {
                                    marginLeft: 2,
                                    flex: "0 0 auto",
                                    color: options.color,
                                    marginRight: 2,
                                },
                            }}
                            direction="row"
                            height={options.itemHeight}
                            alignItems="center"
                        >
                            <NavItem link={pagePath} text={page.name} icon={page.icon} options={options} />
                            {page.subPages.length > 0 && <AccordionIcon />}
                        </AccordionButton>
                        <AccordionPanel p={0} pl="10px">
                            {page.subPages.length > 0 && (
                                <NavItems
                                    pages={page.subPages}
                                    parentPath={pagePath}
                                    currentPath={currentPath}
                                    options={options}
                                />
                            )}
                        </AccordionPanel>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
};
