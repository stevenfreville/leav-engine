"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsRelations = exports.AdminPermissionsActions = exports.ApplicationPermissionsActions = exports.TreeNodePermissionsActions = exports.TreePermissionsActions = exports.AttributePermissionsActions = exports.RecordAttributePermissionsActions = exports.RecordPermissionsActions = exports.LibraryPermissionsActions = exports.PermissionTypes = void 0;
var PermissionTypes;
(function (PermissionTypes) {
    PermissionTypes["RECORD"] = "record";
    PermissionTypes["RECORD_ATTRIBUTE"] = "record_attribute";
    PermissionTypes["ADMIN"] = "admin";
    PermissionTypes["LIBRARY"] = "library";
    PermissionTypes["ATTRIBUTE"] = "attribute";
    PermissionTypes["TREE"] = "tree";
    PermissionTypes["TREE_NODE"] = "tree_node";
    PermissionTypes["TREE_LIBRARY"] = "tree_library";
    PermissionTypes["APPLICATION"] = "application";
})(PermissionTypes = exports.PermissionTypes || (exports.PermissionTypes = {}));
var LibraryPermissionsActions;
(function (LibraryPermissionsActions) {
    LibraryPermissionsActions["ACCESS_LIBRARY"] = "access_library";
    LibraryPermissionsActions["ADMIN_LIBRARY"] = "admin_library";
    LibraryPermissionsActions["ACCESS_RECORD"] = "access_record";
    LibraryPermissionsActions["CREATE_RECORD"] = "create_record";
    LibraryPermissionsActions["EDIT_RECORD"] = "edit_record";
    LibraryPermissionsActions["DELETE_RECORD"] = "delete_record";
})(LibraryPermissionsActions = exports.LibraryPermissionsActions || (exports.LibraryPermissionsActions = {}));
var RecordPermissionsActions;
(function (RecordPermissionsActions) {
    RecordPermissionsActions["ACCESS_RECORD"] = "access_record";
    RecordPermissionsActions["CREATE_RECORD"] = "create_record";
    RecordPermissionsActions["EDIT_RECORD"] = "edit_record";
    RecordPermissionsActions["DELETE_RECORD"] = "delete_record";
})(RecordPermissionsActions = exports.RecordPermissionsActions || (exports.RecordPermissionsActions = {}));
var RecordAttributePermissionsActions;
(function (RecordAttributePermissionsActions) {
    RecordAttributePermissionsActions["ACCESS_ATTRIBUTE"] = "access_attribute";
    RecordAttributePermissionsActions["EDIT_VALUE"] = "edit_value";
})(RecordAttributePermissionsActions = exports.RecordAttributePermissionsActions || (exports.RecordAttributePermissionsActions = {}));
var AttributePermissionsActions;
(function (AttributePermissionsActions) {
    AttributePermissionsActions["ACCESS_ATTRIBUTE"] = "access_attribute";
    AttributePermissionsActions["EDIT_VALUE"] = "edit_value";
})(AttributePermissionsActions = exports.AttributePermissionsActions || (exports.AttributePermissionsActions = {}));
var TreePermissionsActions;
(function (TreePermissionsActions) {
    TreePermissionsActions["ACCESS_TREE"] = "access_tree";
    TreePermissionsActions["EDIT_CHILDREN"] = "edit_children";
})(TreePermissionsActions = exports.TreePermissionsActions || (exports.TreePermissionsActions = {}));
var TreeNodePermissionsActions;
(function (TreeNodePermissionsActions) {
    TreeNodePermissionsActions["ACCESS_TREE"] = "access_tree";
    TreeNodePermissionsActions["DETACH"] = "detach";
    TreeNodePermissionsActions["EDIT_CHILDREN"] = "edit_children";
})(TreeNodePermissionsActions = exports.TreeNodePermissionsActions || (exports.TreeNodePermissionsActions = {}));
var ApplicationPermissionsActions;
(function (ApplicationPermissionsActions) {
    ApplicationPermissionsActions["ADMIN_APPLICATION"] = "admin_application";
    ApplicationPermissionsActions["ACCESS_APPLICATION"] = "access_application";
})(ApplicationPermissionsActions = exports.ApplicationPermissionsActions || (exports.ApplicationPermissionsActions = {}));
var AdminPermissionsActions;
(function (AdminPermissionsActions) {
    AdminPermissionsActions["ACCESS_LIBRARIES"] = "admin_access_libraries";
    AdminPermissionsActions["CREATE_LIBRARY"] = "admin_create_library";
    AdminPermissionsActions["EDIT_LIBRARY"] = "admin_edit_library";
    AdminPermissionsActions["DELETE_LIBRARY"] = "admin_delete_library";
    AdminPermissionsActions["ACCESS_TASKS"] = "admin_access_tasks";
    AdminPermissionsActions["DELETE_TASK"] = "admin_delete_task";
    AdminPermissionsActions["CANCEL_TASK"] = "admin_cancel_task";
    AdminPermissionsActions["ACCESS_ATTRIBUTES"] = "admin_access_attributes";
    AdminPermissionsActions["CREATE_ATTRIBUTE"] = "admin_create_attribute";
    AdminPermissionsActions["EDIT_ATTRIBUTE"] = "admin_edit_attribute";
    AdminPermissionsActions["DELETE_ATTRIBUTE"] = "admin_delete_attribute";
    AdminPermissionsActions["ACCESS_TREES"] = "admin_access_trees";
    AdminPermissionsActions["CREATE_TREE"] = "admin_create_tree";
    AdminPermissionsActions["EDIT_TREE"] = "admin_edit_tree";
    AdminPermissionsActions["DELETE_TREE"] = "admin_delete_tree";
    AdminPermissionsActions["ACCESS_VERSION_PROFILES"] = "admin_access_version_profiles";
    AdminPermissionsActions["CREATE_VERSION_PROFILE"] = "admin_create_version_profile";
    AdminPermissionsActions["EDIT_VERSION_PROFILE"] = "admin_edit_version_profile";
    AdminPermissionsActions["DELETE_VERSION_PROFILE"] = "admin_delete_version_profile";
    AdminPermissionsActions["ACCESS_PERMISSIONS"] = "admin_access_permissions";
    AdminPermissionsActions["EDIT_PERMISSION"] = "admin_edit_permission";
    AdminPermissionsActions["MANAGE_GLOBAL_PREFERENCES"] = "admin_manage_global_preferences";
    AdminPermissionsActions["ACCESS_APPLICATIONS"] = "admin_access_applications";
    AdminPermissionsActions["CREATE_APPLICATION"] = "admin_create_application";
    AdminPermissionsActions["EDIT_APPLICATION"] = "admin_edit_application";
    AdminPermissionsActions["DELETE_APPLICATION"] = "admin_delete_application";
    AdminPermissionsActions["ACCESS_API_KEYS"] = "admin_access_api_keys";
    AdminPermissionsActions["CREATE_API_KEY"] = "admin_create_api_key";
    AdminPermissionsActions["EDIT_API_KEY"] = "admin_edit_api_key";
    AdminPermissionsActions["DELETE_API_KEY"] = "admin_delete_api_key";
    AdminPermissionsActions["EDIT_GLOBAL_SETTINGS"] = "admin_edit_global_settings";
})(AdminPermissionsActions = exports.AdminPermissionsActions || (exports.AdminPermissionsActions = {}));
var PermissionsRelations;
(function (PermissionsRelations) {
    PermissionsRelations["AND"] = "and";
    PermissionsRelations["OR"] = "or";
})(PermissionsRelations = exports.PermissionsRelations || (exports.PermissionsRelations = {}));
