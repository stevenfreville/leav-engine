import{N as e}from"./index-da778430.js";const l="GET_TREES",t=e`
    query GET_TREES($filters: TreesFiltersInput) {
        trees(filters: $filters) {
            totalCount
            list {
                id
                label
                system
                behavior
                libraries {
                    library {
                        id
                        label
                    }
                    settings {
                        allowMultiplePositions
                        allowedAtRoot
                        allowedChildren
                    }
                }
            }
        }
    }
`;export{l as a,t as g};
