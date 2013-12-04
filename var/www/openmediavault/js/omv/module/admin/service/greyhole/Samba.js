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
	autoReload        : true,
	stateId           : "85f1cbf2-23d3-4960-a803-b7fc34d42235",
	columns           : [{
		header   :_("SMB Share"),
		sortable :true,
		dataIndex:"name",
        id       :"name"
	},{
		header   :_("Comment"),
		sortable :true,
		dataIndex:"comment",
        id       :"comment"
	},{
		header   :_("Files copies"),
		sortable :true,
		dataIndex:"num_copies",
        id       :"num_copies"
	},{
		header   :_("Sticky files"),
		sortable :true,
		dataIndex:"sticky_files",
		id       :"sticky_files",
		renderer :OMV.util.Format.booleanRenderer()
	},{
		header   :_("Use Trash"),
		sortable :true,
		dataIndex:"trash",
		id       :"trash",
        renderer :OMV.util.Format.booleanRenderer()
	}],

    initComponent: function() {
        var me = this;
        Ext.apply(me, {
            store : Ext.create("OMV.data.Store", {
                autoLoad : true,
                model    : OMV.data.Model.createImplicit({
                    idProperty  : "uuid",
                    fields      : [    
					{ name : "uuid", type: "string" },
					{ name : "name", type: "string" },
					{ name : "comment", type: "string" },
					{ name : "num_copies", type: "string" },
					{ name : "sticky_files", type: "boolean" },
					{ name : "trash", type: "boolean" }
				]
			}),
                proxy: {
                    type    : "rpc",
                    rpcData : {
                        service : "Greyhole",
                        method  : "getSMBList"
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
            id       : me.getId() + "-fsck",
            xtype    : "button",
            text     : _("Files Check"),
            icon     : "images/greyhole-fsck.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onFsckButton, me, [ me ]),
            scope    : me,
            disabled : true
        },{
            id       : me.getId() + "-unfsck",
            xtype    : "button",
            text     : _("Cancel All Checks"),
            icon     : "images/greyhole-unfsck.png",
            iconCls  : Ext.baseCSSPrefix + "btn-icon-16x16",
            handler  : Ext.Function.bind(me.onUnfsckButton, me, [ me ]),
            scope    : me,
            disabled : true
        }]);
        return items;
    },

    onAddButton: function() {
        var me = this;
        Ext.create("OMV.module.admin.service.greyhole.SambaShare", {
            title     : _("Add Samba Share"),
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
        Ext.create("OMV.module.admin.service.greyhole.SambaShare", {
            title     : _("Edit Samba Share"),
            uuid      : record.get("uuid"),
            listeners : {
                scope  : me,
                submit : function() {
                    this.doReload();
                }
            }
        }).show();
    },

	doDeletion: function () {
        var me = this;
        OMV.Rpc.request({
            scope    : me,
            callback : me.onDeletion,
            rpcData  : {
                service : "Greyhole",
                method  : "removeSMBShare",
                params  : {
                    uuid: record.get("uuid")
                }
            }
        });
	}

});

OMV.WorkspaceManager.registerPanel({
    id          : "sambashares",
    path        : "/service/greyhole",
    text        : _("Samba Shares"),
    position    : 30,
    className   : "OMV.module.admin.service.greyhole.SambaShares"
});
