/**
 *
 * @license http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author Stephane Bocquet <stephane_bocquet@hotmail.com>
 * @author Marcel Beck <marcel.beck@mbeck.org>
 * @copyright Copyright (c) 2011 Stephane Bocquet
 * @copyright Copyright (c) 2011 Marcel Beck
 * @copyright Copyright (c) 2013 OpenMediaVault Plugin Developers
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
// require("js/omv/form/field/SharedFolderComboBox.js")

Ext.define("OMV.module.admin.service.greyhole.Settings", {
    extend : "OMV.workspace.form.Panel",
    uses   : [
        "OMV.module.admin.service.greyhole.InstallDB"
    ],

    rpcService   : "Greyhole",
    rpcGetMethod : "getSettings",
    rpcSetMethod : "setSettings",

    plugins      : [{
        ptype        : "linkedfields",
        correlations : [{
            name       : [
                "installdb"
            ],
            conditions : [
                { name  : "enable", value : false }
            ],
            properties : "!disabled"
        }]
    }],

    initComponent : function () {
        var me = this;

        me.on('load', function () {
            var checked = me.findField('enable').checked;
            var parent = me.up('tabpanel');

            if (!parent)
                return;

            var poolsPanel = parent.down('panel[title=' + _("Pools") + ']');
            var sambaSharesPanel = parent.down('panel[title=' + _("Samba Shares") + ']');

            if (poolsPanel) {
                checked ? poolsPanel.enable() : poolsPanel.disable();
            }
            if (sambaSharesPanel) {
                checked ? sambaSharesPanel.enable() : sambaSharesPanel.disable();
            }
        });
        me.callParent(arguments);
    },

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
                    text  : _("Will receive email reports for daily fsck or when all drives are out of available space.")
                }]
            },{
                xtype      : "checkbox",
                name       : "delete_moves_to_trash",
                fieldLabel : _("Trash deletes"),
                checked    : true,
                boxLabel   : _("Move deleted files to trash instead of deleting them. This is a global setting that can be overided by local option on each Greyhole share.")
            },{
                xtype      : "checkbox",
                name       : "balance_modified_files",
                fieldLabel : _("Balance modified"),
                checked    : false,
                boxLabel   : _("Enable this to use modified files copies to help balance the available space in your storage pool drives.")
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
                boxLabel   : _("Log Greyhole memory usage on each log line.")
            },{
                xtype      : "checkbox",
                name       : "check_for_open_files",
                fieldLabel : _("Check for open Files"),
                checked    : false,
                boxLabel  : _("Disable to get more speed. This might break some files if any application changes your files while Greyhole tries to work on them.")
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
            }]
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
                xtype      : "passwordfield",
                name       : "root_pass",
                fieldLabel : _("Root Password"),
                allowBlank : false,
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Will not be saved.")
                }]
            },{
                xtype     : "label",
                hideLabel : true,
                text      : _("Warning: Changing your database connection properties may result in stoping Greyhole. Stop Greyhole daemon before any change. Make sure the values you are modifying match the MySQL greyhole database values before restarting Greyhole daemon.")
            },{
                border : false,
                html   : "<br />"
            },{
                xtype   : "button",
                name    : "installdb",
                text    : _("Install DB"),
                scope   : this,
                handler : function() {
                    var me = this;
                    OMV.Rpc.request({
                        scope   : me,
                        rpcData : {
                            service : "Greyhole",
                            method  : "doInstallDB",
                            params  : {
                                db_host   : me.getForm().findField("db_host").getValue(),
                                db_name   : me.getForm().findField("db_name").getValue(),
                                db_user   : me.getForm().findField("db_user").getValue(),
                                db_pass   : me.getForm().findField("db_pass").getValue(),
                                root_pass : me.getForm().findField("root_pass").getValue()
                            }
                        }
                    });
                }
            },{
                border : false,
                html   : "<br />"
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
