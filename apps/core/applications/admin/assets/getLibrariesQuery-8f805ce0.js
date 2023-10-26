import{N as e,r as i}from"./index-da778430.js";const r=e`
    ${i}
    query GET_LIBRARIES($id: [ID!], $label: [String!], $system: Boolean, $behavior: [LibraryBehavior!]) {
        libraries(filters: {id: $id, label: $label, system: $system, behavior: $behavior}) {
            totalCount
            list {
                id
                system
                label
                behavior
                icon {
                    ...RecordIdentity
                }
                gqlNames {
                    query
                    type
                    list
                    filter
                    searchableFields
                }
            }
        }
    }
`;export{r as g};
