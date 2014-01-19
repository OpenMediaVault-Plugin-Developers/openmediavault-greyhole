/**
 *
 * @license http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author Stephane Bocquet <stephane_bocquet@hotmail.com>
 * @author Marcel Beck <marcel.beck@mbeck.org>
 * @copyright Copyright (c) 2011 Stephane Bocquet
 * @copyright Copyright (c) 2011 Marcel Beck
 * @copyright Copyright (c) 2013-2014 OpenMediaVault Plugin Developers
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
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
// require("js/omv/module/admin/service/greyhole/util/Format.js")

Ext.define("OMV.module.admin.service.greyhole.Fsck", {
    extend   : "OMV.workspace.window.Form",
    requires : [
        "OMV.form.field.SharedFolderComboBox"
    ],

    rpcService      : "Greyhole",
    rpcSetMethod    : "doFsck",
    width           : 550,
    height          : 410,
    hideResetButton : true,

    getFormItems: function() {
        var me = this;
        return [{
            xtype         : "combo",
            name          : "path",
            fieldLabel    : _("Path"),
            emptyText     : _("Select a path ..."),
            allowBlank    : false,
            allowNone     : false,
            editable      : false,
            triggerAction : "all",
            displayField  : "show",
            valueField    : "path",
            store         : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty : "path",
                    fields     : [
                        { name: "show", type: "string" },
                        { name: "path", type: "string" }
                    ]
                }),
                proxy    : {
                    type    : "rpc",
                    rpcData : {
                        service : "Greyhole",
                        method  : "getFsckCandidates"
                    },
                    appendSortParams : false
                },
                sorters  : [{
                    direction : "ASC",
                    property  : "show"
                }]
            })
        },{
            xtype     :"checkbox",
            name      :"email_report",
            fieldLabel:_("Email report"),
            checked   :false,
            plugins    : [{
                ptype : "fieldinfo",
                text  : _("Send an email when fsck completes, to report on what was checked, and any error that was found.")
            }]
        },{
            xtype     :"checkbox",
            name      :"checksums",
            fieldLabel:_("Checksums"),
            checked   :false,
            plugins    : [{
                ptype : "fieldinfo",
                text  : _("Read ALL files in your storage pool, and check that file copies are identical. This will identify any problem you might have with your file-systems. NOTE: this can take a LONG time to complete, since it will read everything from all your drives!")
            }]
        },{
            xtype     :"checkbox",
            name      :"dont_walk_metadata_store",
            fieldLabel:_("Don't walk metadata store"),
            checked   :false,
            plugins    : [{
                ptype : "fieldinfo",
                text  : _("Speed up fsck by skipping the scan of the metadata store directories. Scanning the metadata stores is only required to re-create symbolic links that might be missing from your shared directories.")
            }]
        },{
            xtype     :"checkbox",
            name      :"find_orphaned_files",
            fieldLabel:_("Find orphaned files"),
            checked   :false,
            plugins    : [{
                ptype : "fieldinfo",
                text  : _("Scan for files with no metadata in the storage pool drives. This will allow you to include existing files on a drive in your storage pool without having to copy them manually.")
            }]
        },{
            xtype     :"checkbox",
            name      :"delete_orphaned_metadata",
            fieldLabel:_("Delete orphaned metadata"),
            checked   :false,
            plugins    : [{
                ptype : "fieldinfo",
                text  : _("When fsck find metadata files with no file copies, delete those metadata files. If the file copies re-appear later, you'll need to run fsck with --find-orphaned-files to have them reappear in your shares.")
            }]
        }];
    }
});

Ext.define("OMV.module.admin.service.greyhole.PoolDisk", {
    extend   : "OMV.workspace.window.Form",
    requires : [
        "OMV.workspace.window.plugin.ConfigObject",
        "OMV.form.field.SharedFolderComboBox"
    ],

    rpcService   : "Greyhole",
    rpcGetMethod : "getPoolDisk",
    rpcSetMethod : "setPoolDisk",
    plugins      : [{
        ptype : "configobject"
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
                        { name: "devicefile", type: "string" },
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

Ext.define("OMV.module.admin.service.greyhole.PoolManagement", {
    extend   : "OMV.workspace.window.Form",
    requires : [
        "OMV.form.field.SharedFolderComboBox"
    ],

    rpcService      : "Greyhole",
    rpcSetMethod    : "doPoolManagement",
    width           : 550,
    height          : 300,
    hideResetButton : true,

    getFormItems: function() {
        var me = this;
        return [{
            xtype         : "combo",
            name          : "path",
            fieldLabel    : _("Pool Disk"),
            emptyText     : _("Select a pool disk ..."),
            allowBlank    : false,
            allowNone     : false,
            editable      : false,
            triggerAction : "all",
            displayField  : "show",
            valueField    : "path",
            store         : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty : "path",
                    fields     : [
                        { name: "show", type: "string" },
                        { name: "path", type: "string" }
                    ]
                }),
                proxy    : {
                    type    : "rpc",
                    rpcData : {
                        service : "Greyhole",
                        method  : "getPoolMngtCandidates"
                    },
                    appendSortParams : false
                },
                sorters  : [{
                    direction : "ASC",
                    property  : "show"
                }]
            })
        },{
            xtype      : "radiogroup",
            fieldLabel : _("Pool Managment"),
            columns    : 1,
            vertical   : true,
            id         : "diskmngt",
            items      : [{
                xtype      : "radio",
                name       : "diskmngt",
                id         : "wait_for",
                hideLabel  : true,
                boxLabel   : _("Wait for"),
                checked    : true,
                inputValue : "wait_for",
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Tell Greyhole that the missing drive will return soon, and that it shouldn't re-create additional file copies to replace it.")
                }]
            },{
                xtype      : "radio",
                name       : "diskmngt",
                id         : "going",
                hideLabel  : true,
                boxLabel   : _("Going"),
                inputValue : "going",
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Tell Greyhole that you want to remove a drive. Greyhole will then make sure you don't loose any files, and that the correct number of file copies are created to replace the missing drive.")
                }]
            },{
                xtype      : "radio",
                name       : "diskmngt",
                id         : "gone",
                hideLabel  : true,
                boxLabel   : _("Gone"),
                inputValue : "gone",
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Tell Greyhole that the missing drive at is gone for good. Greyhole will start replacing the missing file copies instantly.")
                }]
            },{
                xtype      : "radio",
                name       : "diskmngt",
                id         : "replaced",
                hideLabel  : true,
                boxLabel   : _("Replaced"),
                inputValue : "replaced",
                plugins    : [{
                    ptype : "fieldinfo",
                    text  : _("Tell Greyhole that you replaced the drive.")
                }]
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
        "OMV.module.admin.service.greyhole.PoolManagement",
        "OMV.module.admin.service.greyhole.Fsck",
        "OMV.window.Execute"
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
        text      : _("Label"),
        sortable  : true,
        dataIndex : "label",
        stateId   : "label"
    },{
        text      : _("Filesystem"),
        sortable  : true,
        dataIndex : "type",
        stateId   : "type"
    },{
        text      : _("Path"),
        sortable  : true,
        dataIndex : "path",
        stateId   : "path"
    },{
        text      : _("Space"),
        sortable  : true,
        dataIndex : "percent_space",
        stateId   : "percent_space",
        renderer  : OMV.module.services.greyhole.util.Format.spaceRenderer
    },{
        text      : _("Trash"),
        sortable  : true,
        dataIndex : "trash_size",
        stateId   : "trash_size",
        renderer  : OMV.module.services.greyhole.util.Format.trashRenderer
    },{
        text      : _("Min Free"),
        sortable  : true,
        dataIndex : "min_free",
        stateId   : "min_free",
        renderer  : OMV.module.services.greyhole.util.Format.minFreeRenderer
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
                        { name : "label", type: "string" },
                        { name : "type", type: "string" },
                        { name : "path", type: "string" },
                        { name : "total_space", type: "string" },
                        { name : "used_space", type: "string" },
                        { name : "free_space", type: "string" },
                        { name : "trash_size", type: "string" },
                        { name : "potential_available_space", type: "string" },
                        { name : "min_free", type: "string" }
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
            handler  : Ext.Function.bind(me.onPoolManagementButton, me, [ me ]),
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

    onBalanceButton: function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Greyhole - Balance"),
            rpcService      : "Greyhole",
            rpcMethod       : "doBalance",
            hideStartButton : true,
            hideStopButton  : true,
            scrollBottom    : false,
            listeners       : {
                scope     : me,
                finish    : function(wnd, response) {
                    wnd.setButtonDisabled("close", false);
                },
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                    wnd.close();
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    },

    onEmptyTrashButton: function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Greyhole - Empty Trash"),
            rpcService      : "Greyhole",
            rpcMethod       : "doEmptyTrash",
            hideStartButton : true,
            hideStopButton  : true,
            scrollBottom    : false,
            listeners       : {
                scope     : me,
                finish    : function(wnd, response) {
                    wnd.setButtonDisabled("close", false);
                },
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                    wnd.close();
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    },

    onPoolManagementButton: function() {
        var me = this;
        Ext.create("OMV.module.admin.service.greyhole.PoolManagement", {
            title     : _("Disk Pool Management"),
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

    onFsckButton: function() {
        var me = this;
        Ext.create("OMV.module.admin.service.greyhole.Fsck", {
            title     : _("Files Check"),
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

    onUnfsckButton: function() {
        var me = this;
        var wnd = Ext.create("OMV.window.Execute", {
            title           : _("Greyhole - Empty Trash"),
            rpcService      : "Greyhole",
            rpcMethod       : "doUnfsck",
            hideStartButton : true,
            hideStopButton  : true,
            scrollBottom    : false,
            listeners       : {
                scope     : me,
                finish    : function(wnd, response) {
                    wnd.setButtonDisabled("close", false);
                },
                exception : function(wnd, error) {
                    OMV.MessageBox.error(null, error);
                    wnd.close();
                }
            }
        });
        wnd.setButtonDisabled("close", true);
        wnd.show();
        wnd.start();
    }
});

OMV.WorkspaceManager.registerPanel({
    id        : "pools",
    path      : "/service/greyhole",
    text      : _("Pools"),
    position  : 20,
    className : "OMV.module.admin.service.greyhole.Pools"
});