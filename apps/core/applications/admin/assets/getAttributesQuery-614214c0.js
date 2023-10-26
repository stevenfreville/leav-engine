import{N as e}from"./index-da778430.js";const t=e`
    query GET_ATTRIBUTES(
        $id: ID
        $label: String
        $type: [AttributeType]
        $format: [AttributeFormat]
        $system: Boolean
        $multiple_values: Boolean
        $versionable: Boolean
        $libraries: [String!]
    ) {
        attributes(
            filters: {
                id: $id
                label: $label
                type: $type
                format: $format
                system: $system
                multiple_values: $multiple_values
                versionable: $versionable
                libraries: $libraries
            }
        ) {
            totalCount
            list {
                id
                label
                type
                format
                system
                multiple_values
                ... on StandardAttribute {
                    unique
                }
                ... on LinkAttribute {
                    linked_library {
                        id
                    }
                    reverse_link
                }
                ... on TreeAttribute {
                    linked_tree {
                        id
                    }
                }
            }
        }
    }
`;export{t as g};
