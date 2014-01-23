/**
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    Volker Theile <volker.theile@openmediavault.org>
 * @copyright Copyright (c) 2009-2013 Volker Theile
 * @copyright Copyright (c) 2013-2014 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
// require("js/omv/WorkspaceManager.js")
// require("js/omv/workspace/grid/Panel.js")
// require("js/omv/workspace/window/Form.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/util/Format.js")
// require("js/omv/Rpc.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")

Ext.define("OMV.module.admin.service.greyhole.Ignore", {
    extend   : "OMV.workspace.window.Form",
    requires : [
        "OMV.workspace.window.plugin.ConfigObject"
    ],

    rpcService   : "Greyhole",
    rpcGetMethod : "getIgnore",
    rpcSetMethod : "setIgnore",
    plugins      : [{
        ptype : "configobject"
    }],

    width : 500,
    
    getFormItems : function() {
        return [{
            xtype      : "checkbox",
            name       : "folder",
            fieldLabel : _("Folder"),
            checked    : false,
            boxLabel   : _("If checked, ignored object will be a folder instead of a file.")
        },{
            xtype      : "textfield",
            name       : "ignore",
            fieldLabel : _("Ignore"),
            allowBlank : false
        }];
    }
});

/**
 * @class OMV.module.admin.service.greyhole.Ignores
 * @derived OMV.workspace.grid.Panel
 */
Ext.define("OMV.module.admin.service.greyhole.Ignores", {
    extend   : "OMV.workspace.grid.Panel",
    requires : [
        "OMV.Rpc",
        "OMV.data.Store",
        "OMV.data.Model",
        "OMV.data.proxy.Rpc",
        "OMV.util.Format"
    ],
    uses     : [
        "OMV.module.admin.service.greyhole.Ignore"
    ],

    hidePagingToolbar : false,
    stateful          : true,
    stateId           : "a986a76d-6904-1332-b31b-8b48c0ea6dde",
    columns           : [{
        text      : _("Ignore"),
        sortable  : true,
        dataIndex : "ignore",
        stateId   : "ignore"
    },{
        text      : _("Type"),
        sortable  : true,
        dataIndex : "folder",
        stateId   : "folder",
        renderer  : function (value) {
            return value ? _("Folder") : _("File");
        }
    }],

    initComponent : function() {
        var me = this;
        Ext.apply(me, {
            store : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty  : "uuid",
                    fields      : [
                        { name : "uuid", type : "string" },
                        { name : "ignore", type : "string" },
                        { name : "folder", type : "boolean" }
                    ]
                }),
                proxy : {
                    type    : "rpc",
                    rpcData : {
                        service : "Greyhole",
                        method  : "getIgnoreList"
                    }
                }
            })
        });
        me.callParent(arguments);
    },

    onAddButton : function() {
        var me = this;
        Ext.create("OMV.module.admin.service.greyhole.Ignore", {
            title     : _("Add ignored files"),
            uuid      : OMV.UUID_UNDEFINED,
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

    onEditButton: function() {
        var me = this;
        var record = me.getSelected();
        Ext.create("OMV.module.admin.service.greyhole.Ignore", {
            title     : _("Edit ignored files"),
            uuid      : record.get("uuid"),
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

    doDeletion : function(record) {
        var me = this;
        OMV.Rpc.request({
            scope    : me,
            callback : me.onDeletion,
            rpcData  : {
                service : "Greyhole",
                method  : "deleteIgnore",
                params  : {
                    uuid : record.get("uuid")
                }
            }
        });
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "excludes",
    path      : "/service/greyhole",
    text      : _("Ignored Files"),
    position  : 40,
    className : "OMV.module.admin.service.greyhole.Ignores"
});
