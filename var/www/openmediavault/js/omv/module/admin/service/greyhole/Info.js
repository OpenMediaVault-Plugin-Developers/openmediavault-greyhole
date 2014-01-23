/**
 * @license   http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author    OpenMediaVault Plugin Developers
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
// require("js/omv/workspace/panel/Panel.js")

Ext.define("OMV.module.admin.service.greyhole.Info", {
    extend: "Ext.panel.Panel",

    initComponent: function() {
        var me = this;

        me.html = _("Greyhole Information") +
                  "<ul>" +
                    "<li>Greyhole by Guillaume Boudreau, <a href='http://www.greyhole.net/' target=_blank>" +
                      _("Home Page") + "</a></li>" +
                    "<li><a href='https://github.com/gboudreau/Greyhole/wiki' target=_blank>" +
                      _("Greyhole Wiki") + "</a></li>" +
                  "</ul>" +
                  _("Files/Folders that match the patterns below will be ignored by Greyhole.") +
                  "<ul>" +
                    "<li>rsync temporary files</li>" +
                    "<li>Microsoft Office temporary files</li>" +
                    "<li>CrashPlan (restore) temporary files - .cprestoretmp.*</li>" +
                    "<li>SABnzbd temporary folders when extracting a download - .*/_UNPACK_.*</li>" +
                    "<li>Windows thumbs database files - Thumb.db</li>" +
                  "</ul>";
        me.callParent(arguments);
    }
});

OMV.WorkspaceManager.registerPanel({
    id: "info",
    path: "/service/greyhole",
    text: _("Information"),
    position: 50,
    className: "OMV.module.admin.service.greyhole.Info"
});
