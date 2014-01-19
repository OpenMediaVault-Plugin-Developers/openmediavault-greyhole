<?php
/**
 *
 * @license    http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author     Stephane Bocquet <stephane_bocquet@hotmail.com>
 * @copyright  Copyright (c) 2011 Ian Moore
 * @copyright  Copyright (c) 2013-2014 OpenMediaVault Plugin Developers
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
require_once("openmediavault/module.inc");
require_once("openmediavault/config.inc");
require_once("openmediavault/error.inc");
require_once("openmediavault/util.inc");
require_once("openmediavault/initscript.inc");
require_once("openmediavault/log.inc");

class OMVModuleGreyhole extends OMVModuleServiceAbstract
    implements OMVINotifyListener, OMVIModuleServiceStatus {

    public function getName() {
        return "greyhole";
    }

    public function applyConfig() {
        $cmd = "omv-mkconf greyhole 2>&1";
        if(0 !== $this->exec($cmd, $output))
            throw new OMVException(OMVErrorMsg::E_EXEC_FAILED, $cmd, implode("\n", $output));
    }

    public function stopService() {
        $cmd = "/etc/init.d/greyhole stop 2>&1";
        $this->exec($cmd, $output);
    }

    public function startService() {
        global $xmlConfig;
        $xpath = "//services/greyhole";
        $object = $xmlConfig->get($xpath);
        if(is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED,$xpath);

        if(FALSE === boolval($object['enable']))
            return;

        $cmd = "/etc/init.d/greyhole start 2>&1";
        $this->exec($cmd, $output);
    }

    public function getStatus() {
        global $xmlConfig;
        // Get the configuration object
        $xpath  = "//services/greyhole";
        $object = $xmlConfig->get($xpath);
        if (is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        $cmd = sprintf("/etc/init.d/greyhole status");
        OMVUtil::exec($cmd, $output, $result);

        return array(
            "name"    => $this->getName(),
            "title"   => gettext("Greyhole"),
            "enabled" => boolval($object['enable']),
            "running" => (strpos($output[0], 'Greyhole is running.') > -1)
        );
    }

    function bindListeners(OMVNotifyDispatcher $dispatcher) {
        /* Update service if configuration has been modified */
        $dispatcher->addListener(
            OMV_NOTIFY_MODIFY,
            "org.openmediavault.services.greyhole",
            array($this, "setDirty"));

        $dispatcher->addListener(
            OMV_NOTIFY_CREATE | OMV_NOTIFY_MODIFY | OMV_NOTIFY_DELETE,
            "org.openmediavault.services.greyhole.pool_disks.disk",
            array($this, "setDirty"));

        $dispatcher->addListener(
            OMV_NOTIFY_CREATE | OMV_NOTIFY_MODIFY | OMV_NOTIFY_DELETE,
            "org.openmediavault.services.greyhole.smb_shares.share",
            array($this, "setDirty"));
    }

}

// Register module
$moduleMgr = &OMVModuleMgr::getInstance();
$moduleMgr->registerModule(new OMVModuleGreyhole());

// Register new logfile type
OMVLogFile::registerType("greyhole", array(
    "filename" => "greyhole.log",
    "filepath" => "/var/log/greyhole.log",
    "regex"    => "/^(\S+\s+\d+\s+\S+)\s+\d+\s+(\S+)\: (.*)$/",
    "columns"  => array(
        "date"      => array(
            "index" => 1,
            "func"  => create_function('$v', 'return strpdate($v,"M j G:i:s");')
        ),
        "component" => 2,
        "event"     => 3
    )
));
?>
