/**
 *
 * @license http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author Stephane Bocquet <stephane_bocquet@hotmail.com>
 * @author Marcel Beck <marcel.beck@mbeck.org>
 * @copyright Copyright (c) 2011 Stephane Bocquet
 * @copyright Copyright (c) 2011 Marcel Beck
 * @version $Id: greyhole.js 12 2011-11-07 18:52:10Z
 *          stephane_bocquet@hotmail.com $
 *
 * This file is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * This file is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this file. If not, see <http://www.gnu.org/licenses/>.
 */
// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/form/Panel.js")
// require("js/omv/form/SharedFolderComboBox.js")

Ext.define("OMV.module.admin.service.greyhole.Settings", {
    extend : "OMV.workspace.form.Panel",

    rpcService   : "Greyhole",
    rpcGetMethod : "getSettings",
    rpcSetMethod : "setSettings",

    getFormItems : function() {
        return [{
            xtype    : "fieldset",
            title    : _("General settings"),
            defaults : {
                labelSeparator:""
            },
            items    : [{
                xtype      : "checkbox",
                name       : "enable",
                fieldLabel : _("Enable"),
                checked    : false
            },{
                xtype      : "textfield",
                name       : "email_to",
                fieldLabel : _("Email"),
                allowBlank : true,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Will receive email reports for daily fsck, or when all drives are out of available space.")
                }]
            },{
                xtype      : "checkbox",
                name       : "delete_moves_to_trash",
                fieldLabel : _("Trash deletes"),
                checked    : true,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Move deleted files to trash instead of deleting them (This is a global setting that can be overided by local option on each Greyhole share)")
                }]
            },{
                xtype      : "checkbox",
                name       : "balance_modified_files",
                fieldLabel : _("Balance modified"),
                checked    : false,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Enable this to use modified files copies to help balance the available space in your storage pool drives.")
                }]
            },{
                xtype      : "numberfield",
                name       : "df_cache_time",
                fieldLabel : _("Disk Free space Cache time"),
                inputValue : 10,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("How long should free disk space calculations be cached (in seconds). Use 0 to disable caching.")
                }]
            },{
                xtype      : "checkbox",
                name       : "log_memory_usage",
                fieldLabel : _("Log Memory Usage"),
                checked    : false,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Log Greyhole memory usage on each log line.")
                }]
            },{
                xtype      : "checkbox",
                name       : "check_for_open_files",
                fieldLabel : _("Check for open Files"),
                checked    : false,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Disable to get more speed, but this might break some files, if any application change your files while Greyhole tries to work on them.")
                }]
            },{
                xtype      : "combo",
                name       : "log_level",
                hiddenName : "log_level",
                fieldLabel : _("Log level"),
                mode       : "local",
                store      : new Ext.data.SimpleStore({
                    fields  : [ "value", "text" ],
                    data    : [
                        [ "ERROR", _("Error") ],
                        [ "WARN", _("Warn") ],
                        [ "INFO", _("Info") ],
                        [ "DEBUG", _("Debug") ]
                    ]
                }),
                displayField  : "text",
                valueField    : "value",
                allowBlank    : false,
                editable      : false,
                triggerAction : "all",
                value         : "INFO"
            },{
                xtype      : "textarea",
                name       : "extraoptions",
                fieldLabel : _("Extra options"),
                allowBlank : true
            },{
                xtype    : "fieldset",
                title    : _("Database Settings"),
                defaults : {
                    labelSeparator : ""
                },
                items    : [{
                    xtype      : "textfield",
                    name       : "db_host",
                    fieldLabel : _("Hostname"),
                    allowBlank : false
                },{
                    xtype      : "textfield",
                    name       : "db_name",
                    fieldLabel : _("Database Name"),
                    allowBlank : false
                },{
                    xtype      : "textfield",
                    name       : "db_user",
                    fieldLabel : _("Username"),
                    allowBlank : false
                },{
                    xtype      : "passwordfield",
                    name       : "db_pass",
                    fieldLabel : _("Password"),
                    allowBlank : false
                },{
                    xtype     : "label",
                    hideLabel : true,
                    text      : _("Warning: Changing your database connection properties may result in stoping Greyhole. Stop Greyhole daemon before any change. Check that the values you're modifying are matching the one of your MySQL greyhole database before restarting Greyhole daemon.")
                }]
            }]
        }];
    }
});

OMV.WorkspaceManager.registerPanel({
    id: "settings",
    path: "/service/greyhole",
    text: _("Settings"),
    position: 10,
    className: "OMV.module.admin.service.greyhole.Settings"
});
