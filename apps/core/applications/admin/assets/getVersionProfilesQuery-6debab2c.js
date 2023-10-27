import{f as r}from"./index-da778430.js";const s=r`
    query GET_VERSION_PROFILES($filters: VersionProfilesFiltersInput, $sort: SortVersionProfilesInput) {
        versionProfiles(filters: $filters, sort: $sort) {
            list {
                id
                label
            }
        }
    }
`;export{s as g};
