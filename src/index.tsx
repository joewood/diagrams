import { RouteComponentProps, Router } from "@reach/router";
import * as React from "react";
import { FC } from "react";
import ReactDOM from "react-dom";
import styled, { createGlobalStyle } from "styled-components";
import { TextDemo } from "./text-demo";

const Global = createGlobalStyle`
    html, body {
        margin:0;
        padding:0;
    }
    body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
            "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
`;

const Root = styled.div`
    margin: 0;
    padding: 0;
    overflow-y: hidden;
    & > header {
        height: 50px;
    }
    & .container {
        width: 100vw;
        position: absolute;
        top: 50px;
        height: calc(100vh - 50px);
        background-color: black;
        margin: 0;
        padding: 0;
    }
`;

const Main: FC<RouteComponentProps> = ({ children }) => {
    return (
        <Root>
            <Global />
            <header>
                <div>DAG 3D Component</div>
            </header>
            <div className="container">{children}</div>
        </Root>
    );
};

ReactDOM.render(
    <Router>
        <Main path="/">
            <TextDemo path="text" />
        </Main>
    </Router>,
    document.getElementById("root")
);
