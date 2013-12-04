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
// require("js/omv/workspace/grid/Panel.js")
// require("js/omv/workspace/window/Form.js")
// require("js/omv/workspace/window/plugin/ConfigObject.js")
// require("js/omv/Rpc.js")
// require("js/omv/data/Store.js")
// require("js/omv/data/Model.js")
// require("js/omv/data/proxy/Rpc.js")
// require("js/omv/form/field/SharedFolderComboBox.js")

Ext.define("OMV.module.admin.service.greyhole.PoolDisk", {
    extend: "OMV.workspace.window.Form",
    requires: [
        "OMV.workspace.window.plugin.ConfigObject",
        "OMV.form.field.SharedFolderComboBox"
    ],

    rpcService: "Greyhole",
    rpcGetMethod: "getPoolDisk",
    rpcSetMethod: "setPoolDisk",
    plugins: [{
        ptype: "configobject"
    }],

    getFormItems: function() {
        var me = this;
        return [{
            xtype         : "combo",
            name          : "mntentref",
            fieldLabel    : _("Volume"),
            emptyText     : _("Select a volume ..."),
            allowBlank    : false,
            allowNone     : false,
            editable      : false,
            readOnly      : (me.uuid !== OMV.UUID_UNDEFINED),
            triggerAction : "all",
            displayField  : "description",
            valueField    : "uuid",
            store         : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty : "uuid",
                    fields     : [
                        { name: "uuid", type: "string" },
                        { name: "description", type: "string" }
                    ]
                }),
                proxy    : {
                    type    : "rpc",
                    rpcData : {
                        service : "Greyhole",
                        method  : "getPoolDiskCandidates"
                    },
                    appendSortParams : false
                },
                sorters  : [{
                    direction : "ASC",
                    property  : "description"
                }]
            })
        },{
            xtype      : "numberfield",
            name       : "min_free",
            fieldLabel : _("Min Free (GiB)"),
            allowBlank : false,
            plugins    : [{
                ptype : "fieldinfo",
                text  : _("This is how much free space you want to reserve on each drive. This is a soft limit that will be ignored if the necessary hard drives are below their minimum.")
            }]
        }];
    }
});

Ext.define("OMV.module.admin.service.greyhole.Pools", {
    extend   : "OMV.workspace.grid.Panel",
    requires : [
        "OMV.Rpc",
        "OMV.data.Store",
        "OMV.data.Model",
        "OMV.data.proxy.Rpc"
    ],
    uses     : [
        "OMV.module.admin.service.greyhole.PoolDisk",
        "OMV.module.admin.service.greyhole.PoolMgmt",
        "OMV.module.admin.service.greyhole.Fsck"
    ],

    hidePagingToolbar : false,
    stateful          : true,
    stateId           : "85f1cbf2-23d3-4960-a803-b7fc34d42235",
    autoReload        :true,
    columns:[{
        text      : _("Volume"),
        sortable  : true,
        dataIndex : "volume",
        stateId   : "volume"
    },{
        text      :_("Label"),
        sortable  :true,
        dataIndex :"label",
        stateId   :"label"
    },{
        text      :_("Filesystem"),
        sortable  :true,
        dataIndex :"type",
        stateId   :"type"
    },{
        text      :_("Path"),
        sortable  :true,
        dataIndex :"path",
        stateId   :"path"
    },{
        text      :_("Space"),
        sortable  :true,
        dataIndex :"percent_space",
        stateId   :"percent_space"
    },{
        text      :_("Trash"),
        sortable  :true,
        dataIndex :"trash_size",
        stateId   :"trash_size"
    },{
        text      :_("Min Free"),
        sortable  :true,
        dataIndex :"min_free",
        stateId   :"min_free",
        renderer  :this.min_free_renderer
    }],

    initComponent: function() {
        var me = this;
        Ext.apply(me, {
            store: Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty  : "uuid",
                    fields      : [
                        { name : "uuid", type: "string" },
                        { name : "volume", type: "string" },
                        { name : "type", type: "string" },
                        { name : "path", type: "string" },
                        { name :"total_space", type: "string" },
                        { name :"used_space", type: "string" },
                        { name :"free_space", type: "string" },
                        { name :"trash_size", type: "string" },
                        { name :"potential_available_space", type: "string" },
                        { name :"min_free", type: "string" }
                    ]
                }),
                proxy: {
                    type    : "rpc",
                    rpcData : {
                        service : "Greyhole",
                        method  : "getPoolList"
                    }
                }
            })
        });
        me.callParent(arguments);
    },

    getTopToolbarItems: function() {
        var me = this;
        var items = me.callParent(arguments);

        Ext.Array.insert(items, 3, [{
            id       : me.getId() + "-poolmngt",
            xtype    : "button",
            text     : _("Pool Management"),
            icon     : "images/greyhole-poolmngt.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onPoolMngtButton, me, [ me ]),
            scope    : me
        },{
            id       : me.getId() + "-balance",
            xtype    : "button",
            text     : _("Files Balance"),
            icon     : "images/greyhole-balance.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onBalanceButton, me, [ me ]),
            scope    : me
        },{
            id       : me.getId() + "-fsck",
            xtype    : "button",
            text     : _("Files Check"),
            icon     : "images/greyhole-fsck.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onFsckButton, me, [ me ]),
            scope    : me
        },{
            id       : me.getId() + "-unfsck",
            xtype    : "button",
            text     : _("Cancel All Checks"),
            icon     : "images/greyhole-unfsck.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onUnfsckButton, me, [ me ]),
            scope    : me
        },{
            id       : me.getId() + "-emptytrash",
            xtype    : "button",
            text     : _("Empty Trash"),
            icon     : "images/greyhole-emptytrash.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onEmptyTrashButton, me, [ me ]),
            scope    : me
        }]);
        return items;
    },

    onAddButton: function() {
        var me = this;
        Ext.create("OMV.module.admin.service.greyhole.PoolDisk", {
            title     : _("Add Pool Disk"),
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
        Ext.create("OMV.module.admin.service.greyhole.PoolDisk", {
            title     : _("Edit Pool Disk"),
            uuid      : record.get("uuid"),
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

    startDeletion : function (records) {
        var me = this;
        if (records.length <= 0)
            return;
        OMV.MessageBox.show({
            title      : _("Delete Pool Disk"),
            msg        : _("Do you want to remove the content of the pool disk directory recursively? Note, the data will be permanently deleted then. Select 'No' to delete the pool disk directory only or 'Cancel' to abort."),
            icon       : Ext.Msg.QUESTION,
            buttonText : {
                yes     : _("Yes"),
                no      : _("No"),
                cancel  : _("Cancel")
            },
            scope      : me,
            fn         : function (answer) {
                me.deleteRecursive = false;
                switch (answer) {
                    case "no":
                        OMV.MessageBox.show({
                            title   :_("Confirmation"),
                            msg     :_("Do you really want to remove the pool disk directory content?"),
                            buttons :OMV.Msg.YESCANCEL,
                            fn      :function (answer) {
                                if (answer === "yes") {
                                    me.deleteRecursive = true;
                                    me.superclass.startDeletion.apply(this,
                                        [ records ]);
                                }
                            },
                            scope   :this,
                            icon    :Ext.Msg.QUESTION
                        });
                        break;
                    case "yes":
                        me.superclass.startDeletion.apply(this, [ records ]);
                        break;
                    case "cancel":
                        break;
                }
            }
        });
    },

    doDeletion: function(record) {
        var me = this;
        OMV.Rpc.request({
            scope: me,
            callback: me.onDeletion,
            rpcData: {
                service: "Greyhole",
                method: "deletePoolDisk",
                params: {
                    uuid: record.get("uuid"),
                    recursive: me.deleteRecursive
                }
            }
        });
    },

    afterDeletion: function() {
        var me = this;
        me.callParent(arguments);
        // Delete private variable which is not required anymore.
        delete me.deleteRecursive;
    },

    min_free_renderer:function (val, cell, record, row, col, store) {
        val = val + ' GiB';
        return val;
    }
});

OMV.WorkspaceManager.registerPanel({
    id          : "pools",
    path        : "/service/greyhole",
    text        : _("Pools"),
    position    : 20,
    className   : "OMV.module.admin.service.greyhole.Pools"
});