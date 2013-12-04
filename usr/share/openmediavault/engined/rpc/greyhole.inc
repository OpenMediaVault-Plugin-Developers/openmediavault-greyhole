<?php
/**
 *
 * @license    http://www.gnu.org/licenses/gpl.html GPL Version 3
 * @author     Stephane Bocquet <stephane_bocquet@hotmail.com>
 * @author     Marcel Beck <marcel.beck@mbeck.org>
 * @copyright  Copyright (c) 2011-2012 Stephane Bocquet
 * @copyright  Copyright (c) 2011-2012 Marcel Beck
 * @version    $Id: greyhole.inc 12 2011-11-07 18:52:10Z stephane_bocquet@hotmail.com $
 *
 * This file is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This file is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this file. If not, see <http://www.gnu.org/licenses/>.
 *
 */

require_once("openmediavault/object.inc");
require_once("openmediavault/error.inc");
require_once("openmediavault/util.inc");
require_once("openmediavault/rpc.inc");
require_once("openmediavault/notify.inc");

class OMVRpcServiceGreyhole extends OMVRpcServiceAbstract {

    public function getName() {
        return "Greyhole";
    }

    public function initialize() {
        $this->registerMethod("getSettings");
        $this->registerMethod("setSettings");

        $this->registerMethod("getPoolList");
        $this->registerMethod("getPoolDisk");
        $this->registerMethod("setPoolDisk");
        $this->registerMethod("deletePoolDisk");

        $this->registerMethod("getPoolDiskCandidates");
        $this->registerMethod("getPoolDiskCount");

        $this->registerMethod("getSMBShareCandidates");
        $this->registerMethod("getSMBList");
        $this->registerMethod("getSMBShare");
        $this->registerMethod("setSMBShare");
        $this->registerMethod("removeSMBShare");

        $this->registerMethod("getFsckCandidates");
        $this->registerMethod("getPoolMngtCandidates");

        $this->registerMethod("doPoolMngt");
        $this->registerMethod("doBalance");
        $this->registerMethod("doFsck");
        $this->registerMethod("doUnfsck");
        $this->registerMethod("doEmptyTrash");
    }

    public function getSettings($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Get the configuration object.
        $xpath = "//services/greyhole";
        $object = $xmlConfig->get($xpath);
        if(is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        // Get configuration object
        $xpath  = "//services/greyhole";
        $object = $xmlConfig->get($xpath);
        if (is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        // Modify result data
        $object['enable']                 = boolval($object['enable']);
        $object['delete_moves_to_trash']  = boolval($object['delete_moves_to_trash']);
        $object['balance_modified_files'] = boolval($object['balance_modified_files']);
        $object['log_memory_usage']       = boolval($object['log_memory_usage']);
        $object['check_for_open_files']   = boolval($object['check_for_open_files']);

        $object['db_host'] = $object['db']['db_host'];
        $object['db_user'] = $object['db']['db_user'];
        $object['db_pass'] = $object['db']['db_pass'];
        $object['db_name'] = $object['db']['db_name'];

        return $object;
    }

    public function setSettings($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "enable"                 : { "type" : "boolean" },
                "email_to"               : { "type" : "string" },
                "log_level"              : { "type" : "string", "enum" : [ "ERROR", "WARN", "INFO", "DEBUG" ] },
                "delete_moves_to_trash"  : { "type" : "boolean" },
                "balance_modified_files" : { "type" : "boolean" },
                "df_cache_time"          : { "type" : "integer" },
                "log_memory_usage"       : { "type" : "boolean" },
                "check_for_open_files"   : { "type" : "boolean" },
                "extraoptions"           : { "type" : "string" },
                "db_host"                : { "type" : "string" },
                "db_user"                : { "type" : "string" },
                "db_pass"                : { "type" : "string" },
                "db_name"                : { "type" : "string" }
            }
        }');

        // Get existing configuration object
        $xpath = "//services/greyhole";
        $oldObject = $xmlConfig->get($xpath);
        if (is_null($oldObject))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        if (empty($params['email_to'])) {
            $xpath_email  = "//system/email";
            $object_email = $xmlConfig->get($xpath_email);
            if (is_null($object_email))
                throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath_email);
            $params['email_to'] = $object_email['primaryemail'];
        }

        // Prepare configuration data
        $object = array(
            'enable'                 => array_boolval($params, 'enable'),
            'email_to'               => $params['email_to'],
            'log_level'              => $params['log_level'],

            'delete_moves_to_trash'  => array_boolval($params, 'delete_moves_to_trash'),
            'balance_modified_files' => array_boolval($params, 'balance_modified_files'),

            'df_cache_time'          => $params['df_cache_time'],
            'log_memory_usage'       => array_boolval($params, 'log_memory_usage'),
            'check_for_open_files'   => array_boolval($params, 'check_for_open_files'),
            "extraoptions"           => $params['extraoptions'],

            "pool_disks"             => isset($oldObject['pool_disks']) ? $oldObject['pool_disks'] : array(),
            "smb_shares"             => isset($oldObject['smb_shares']) ? $oldObject['smb_shares'] : array(),
            "db"                     => array(
                'db_engine' => 'mysql',
                'db_host'   => $params['db_host'],
                'db_user'   => $params['db_user'],
                'db_pass'   => $params['db_pass'],
                'db_name'   => $params['db_name'],
            ),
        );

        // Set configuration object
        if (FALSE === $xmlConfig->replace($xpath, $object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED);

        // Notify general configuration changes
        $dispatcher = &OMVNotifyDispatcher::getInstance();
        $dispatcher->notify(OMV_NOTIFY_MODIFY,
            "org.openmediavault.services.greyhole", $object);
    }

    public function getPoolList($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "start"     : { "type" : "integer" },
                "limit"     : { ' . $GLOBALS['OMV_JSONSCHEMA_COUNTFIELD'] . ' },
                "sortfield" : { ' . $GLOBALS['OMV_JSONSCHEMA_SORTFIELD'] . ' },
                "sortdir"   : { ' . $GLOBALS['OMV_JSONSCHEMA_SORTDIR'] . ' }
            }
        }');

        // Get configuration object
        $xpath = "//services/greyhole/pool_disks/disk";
        $greyhole_pool_disks = $xmlConfig->getList($xpath);
        if (is_null($greyhole_pool_disks))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        $cmd = sprintf("greyhole --stats --json");
        OMVUtil::exec($cmd, $output, $result);
        if (isset($output[0]))
            $greyhole_stats = json_decode($output[0]);
        else
            $greyhole_stats = null;

        // Add additional informations.
        foreach ($greyhole_pool_disks as $objectk => &$objectv) {
            $objectv['volume'] = gettext("n/a");
            // Get the mount point configuration object to append additional
            // informations, e.g. the devicefile or a modified long
            // description, to the returned objects.
            $xpath        = sprintf("//system/fstab/mntent[uuid='%s']", $objectv['mntentref']);
            $fstab_object = $xmlConfig->get($xpath);
            if (! is_null($fstab_object) && ! empty($fstab_object)) {
                $fs = new OMVFilesystem($fstab_object['fsname']);
                if (TRUE === $fs->exists()) {
                    $objectv['volume'] = $fs->getDeviceFile();
                    $objectv['label']  = $fs->getLabel();
                    $objectv['type']   = $fs->getType();
                }
                $objectv['path'] = $fstab_object['dir'] . '/.greyhole';
            }

            if (($greyhole_stats !== null) and isset($greyhole_stats->$objectv['path'])) {
                $objectv['total_space']               = $greyhole_stats->$objectv['path']->total_space;
                $objectv['used_space']                = $greyhole_stats->$objectv['path']->used_space;
                $objectv['free_space']                = $greyhole_stats->$objectv['path']->free_space;
                $objectv['trash_size']                = $greyhole_stats->$objectv['path']->trash_size;
                $objectv['potential_available_space'] = $greyhole_stats->$objectv['path']->potential_available_space;
            }
        }

        // Filter result
        return $this->applyFilter($greyhole_pool_disks, $params['start'], $params['limit'],
            $params['sortfield'], $params['sortdir']);
    }

    public function getPoolDisk($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "uuid" : { ' . $GLOBALS['OMV_JSONSCHEMA_UUID_UNDEFINED'] . ' }
            }
        }');

        // Get configuration object
        $xpath = "//services/greyhole/pool_disks/disk[uuid='{$params['uuid']}']";
        $object = $xmlConfig->get($xpath);
        if (is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        // Build the full path of the shared folder to display it in the WebGUI.
        $xpath = sprintf("//system/fstab/mntent[uuid='%s']", $object['mntentref']);
        $meobject = $xmlConfig->get($xpath);
        if (is_null($meobject))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        return $object;
    }

    public function setPoolDisk($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "uuid"      : { ' . $GLOBALS['OMV_JSONSCHEMA_UUID_UNDEFINED'] . ' },
                "mntentref" : { ' . $GLOBALS['OMV_JSONSCHEMA_UUID'] . ' },
                "min_free"  : { "type" : "integer" }
            }
        }');

        // Prepare configuration data. Use the name of the shared folder
        // as the relative directory name of the share.
        $object = array(
            "uuid"      => ($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) ? OMVUtil::uuid() : $params['uuid'],
            "mntentref" => $params['mntentref'],
            "min_free"  => (int) $params['min_free'],
        );

        $success = FALSE;

        if($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) {
            // Check uniqueness
            if (TRUE === $xmlConfig->exists("//services/greyhole/pool_disks/disk[uuid='{$object['uuid']}']"))
                throw new OMVException(OMVErrorMsg::E_CONFIG_OBJECT_UNIQUENESS);

            // Append object to configuration
            $success = $xmlConfig->set("//services/greyhole/pool_disks", array("disk" => $object));
            break;
        } else {
            // Get existing configuration object
            $xpath     = "//services/greyhole/pool_disks/disk[uuid='{$params['uuid']}']";
            $oldObject = $xmlConfig->get($xpath);
            if (is_null($oldObject))
                throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

            // Update existing configuration object
            $success = $xmlConfig->replace($xpath, $object);
        }

        if ($success === false)
            throw new OMVException(OMVErrorMsg::E_CONFIG_SET_OBJECT_FAILED);

        // Notify configuration changes
        $dispatcher = &OMVNotifyDispatcher::getInstance();
        $dispatcher->notify(($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) ?
            OMV_NOTIFY_CREATE : OMV_NOTIFY_MODIFY,
            "org.openmediavault.services.greyhole.pool_disks.disk", $object);

        // Return the configuration object.
        return $object;
    }

    public function deletePoolDisk($params, $context) {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "uuid"      : { ' . $GLOBALS['OMV_JSONSCHEMA_UUID_UNDEFINED'] . ' },
                "recursive" : { "type" : "boolean" }
            }
        }');

        // Get the configuration object
        $xpath = "//services/greyhole/pool_disks/disk[uuid='{$params['uuid']}']";
        $object = $this->deleteConfigObjectByPath($xpath,
            "org.openmediavault.services.greyhole.pool_disks.disk");

        // Return the deleted configuration object.
        return $object;
    }

    public function getPoolDiskCandidates($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get list of mount points, except bind mounts.
        $xpath   = "//system/fstab/mntent[not(contains(opts,'bind'))]";
        $objects = $xmlConfig->getList($xpath);
        if (is_null($objects))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        // Get the filesystem details for each mount point.
        $result = array();
        foreach ($objects as $objectk => $objectv) {
            $fs = new OMVFilesystem($objectv['fsname']);
            if (! $fs->exists())
                continue;

            // Skip the filesystems that are not mounted at the moment.
            if (FALSE === $fs->isMounted())
                continue;

            // Get some filesystem details.
            $devicefile = $fs->getDeviceFile();
            $label = $fs->getLabel();

            // Prepare result object.
            $object = array(
                "uuid"        => $objectv['uuid'],
                "devicefile"  => $devicefile,
                "description" => !empty($label) ? $label : $devicefile
            );

            // Get some more filesystem details if possible.
            if(FALSE !== ($fsStats = $fs->getStatistics())) {
                $object['description'] = sprintf(
                    gettext("%s (%s available)"), $object['description'],
                    binary_format($fsStats['available']));
            }

            $result[] = $object;
        }

        return $result;
    }

    public function getPoolDiskCount($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get list of mount points, except bind mounts.
        $xpath = "//services/greyhole/pool_disks/disk";
        $count = $xmlConfig->count($xpath);
        if (is_null($count))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        $result = array();
        for ($i = 1;$i <= $count;$i ++) {
            $result[] = array(
                'number' => $i,
                'name'   => $i,
            );
        }

        return $result;
    }

    public function getSMBShareCandidates($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get list of mount points, except bind mounts.
        $xpath = "//services/smb/shares/share";
        $objects = $xmlConfig->getList($xpath);
        if (is_null($objects))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        // Get the filesystem details for each mount point.
        $result = array();
        foreach ($objects as $objectk => $objectv) {
            if (NULL !== ($xmlConfig->get("//services/greyhole/smb_shares/share[smbref='{$objectv['uuid']}']")))
                continue;
            // Get the filesystem details.
            $object   = array(
                "uuid" => $objectv['uuid'],
                "name" => $objectv['name'],
            );
            $result[] = $object;
        }

        return $result;
    }

    public function getSMBList($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "start"     : { "type" : "integer" },
                "limit"     : { ' . $GLOBALS['OMV_JSONSCHEMA_COUNTFIELD'] . ' },
                "sortfield" : { ' . $GLOBALS['OMV_JSONSCHEMA_SORTFIELD'] . ' },
                "sortdir"   : { ' . $GLOBALS['OMV_JSONSCHEMA_SORTDIR'] . ' }
            }
        }');

        // Get configuration object
        $xpath = "//services/greyhole/smb_shares/share";
        $objects = $xmlConfig->getList($xpath);
        if (is_null($objects))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        // Add additional informations.
        foreach ($objects as $objectk => &$objectv) {
            $xpath    = sprintf("//services/smb/shares/share[uuid='%s']", $objectv['smbref']);
            $meobject = $xmlConfig->get($xpath);
            if (! is_null($meobject) && ! empty($meobject)) {
                $objectv['name']    = $meobject['name'];
                $objectv['comment'] = $meobject['comment'];
            }
        }

        // Filter result
        return $this->applyFilter($objects, $params['start'], $params['limit'], $params['sortfield'], $params['sortdir']);
    }

    public function getSMBShare($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "uuid" : { ' . $GLOBALS['OMV_JSONSCHEMA_UUID_UNDEFINED'] . ' }
            }
        }');

        // Get configuration object
        $xpath  = "//services/greyhole/smb_shares/share[uuid='{$params['uuid']}']";
        $object = $xmlConfig->get($xpath);
        if (is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        $object['num_copies']   = intval($object['num_copies']);
        $object['sticky_files'] = boolval($object['sticky_files']);
        $object['trash']        = boolval($object['trash']);

        return $object;
    }

    public function setSMBShare($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "uuid"         : { ' . $GLOBALS['OMV_JSONSCHEMA_UUID_UNDEFINED'] . ' },
                "smbref"       : { ' . $GLOBALS['OMV_JSONSCHEMA_UUID'] . ' },
                "num_copies"   : { "type" : "integer" },
                "sticky_files" : { "type" : "boolean" },
                "trash"        : { "type" : "boolean" }
            }
        }');

        // Prepare configuration data. Use the name of the shared folder
        // as the relative directory name of the share.
        $object = array(
            "uuid"            => ($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) ? OMVUtil::uuid() : $params['uuid'],
            "smbref"          => $params['smbref'],
            "num_copies"      => intval($params['num_copies']),
            "sticky_files"    => array_boolval($params, 'sticky_files'),
            "trash"           => array_boolval($params, 'trash'),
        );

        // Set the configuration object.
        $success = FALSE;
        if($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) {
            // Check uniqueness
            if (TRUE === $xmlConfig->exists("//services/greyhole/smb_shares/share[" . "uuid='{$object['uuid']}']"))
                throw new OMVException(OMVErrorMsg::E_CONFIG_OBJECT_UNIQUENESS);

            // Append object to configuration
            $success = $xmlConfig->set("//services/greyhole/smb_shares", array("share" => $object));
        } else {
            // Get existing configuration object
            $xpath = "//services/greyhole/smb_shares/share[uuid='{$params['uuid']}']";

            // Update existing configuration object
            $success = $xmlConfig->replace($xpath, $object);
        }

        // Notify configuration changes.
        $dispatcher = &OMVNotifyDispatcher::getInstance();
        $dispatcher->notify(($params['uuid'] == $GLOBALS['OMV_UUID_UNDEFINED']) ?
            OMV_NOTIFY_CREATE : OMV_NOTIFY_MODIFY,
            "org.openmediavault.services.greyhole.smb_shares.share", $object);

        // Return the configuration object.
        return $object;
    }

    public function removeSMBShare($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "uuid" : { ' . $GLOBALS['OMV_JSONSCHEMA_UUID_UNDEFINED'] . ' }
            }
        }');

        $xpath_greyhole_smb_share = "//services/greyhole/smb_shares/share[uuid='{$params['uuid']}']";
        $object = $xmlConfig->get($xpath_greyhole_smb_share);
        if (is_null($object))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath_greyhole_smb_share);

        $xpath_smb_share = "//services/smb/shares/share[uuid='{$object['smbref']}']";
        $smb_share       = $xmlConfig->get($xpath_smb_share);
        if (is_null($smb_share))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath_smb_share);

        // Notify configuration changes.
        $dispatcher = &OMVNotifyDispatcher::getInstance();
        $dispatcher->notify(OMV_NOTIFY_PREDELETE,
            "org.openmediavault.services.greyhole.smb_shares.share", $object);

        if (false === ($meObject = $xmlConfig->delete($xpath_greyhole_smb_share)))
            throw new OMVException(OMVErrorMsg::E_CONFIG_OBJECT_NOT_FOUND, $xpath_greyhole_smb_share);

        $outputFile = tempnam(sys_get_temp_dir(), "greyhole_remove_share");
        $cmd        = 'sudo greyhole --remove-share ' . $smb_share['name'] . ' >' . $outputFile . ' 2>&1 & echo $!';
        OMVUtil::exec($cmd, $output, $result);
        if ($result !== 0)
            throw new OMVException(OMVErrorMsg::E_EXEC_FAILED, $cmd, implode("\n", $output));

        // Remember pid and content filename in session
        $pid = intval($output[0]);
        $_SESSION['execjob'][$pid] = array(
            "pid"        => $pid,
            "outputFile" => $outputFile
        );

        $dispatcher = &OMVNotifyDispatcher::getInstance();
        $dispatcher->notify(OMV_NOTIFY_DELETE, "org.openmediavault.services.greyhole.smb_shares.share");

        // Return the deleted configuration object.
        return $object;
    }

    public function getFsckCandidates($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        $type = $params['type'];
        $result = array();

        // Add additional informations.
        if (in_array($type, array('all', 'smb'))) {
            // Get SMB Shares
            $xpath = "//services/greyhole/smb_shares/share";
            $greyhole_smb_shares = $xmlConfig->getList($xpath);
            if (is_null($greyhole_smb_shares))
                throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

            foreach ($greyhole_smb_shares as $objectk => &$objectv) {
                $xpath = sprintf("//services/smb/shares/share[uuid='%s']", $objectv['smbref']);
                $smb_object = $xmlConfig->get($xpath);
                if (is_null($smb_object))
                    throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

                $xpath = sprintf("//system/shares/sharedfolder[uuid='%s']", $smb_object['sharedfolderref']);
                $shared_object = $xmlConfig->get($xpath);
                if (is_null($shared_object))
                    throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

                $xpath = sprintf("//system/fstab/mntent[uuid='%s']", $shared_object['mntentref']);
                $fstab_object = $xmlConfig->get($xpath);
                if (is_null($fstab_object))
                    throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

                $object   = array(
                    'type' => 'SMB Share',
                    'name' => $smb_object['name'],
                    'show' => 'SMB Share: ' . $smb_object['name'],
                    'path' => $fstab_object['dir'] . '/' . $shared_object['reldirpath'],
                );
                $result[] = $object;
            }
        }

        // Get Pool Disks
        if (in_array($type, array('all', 'pool'))) {
            $xpath = "//services/greyhole/pool_disks/disk";
            $greyhole_pool_disks = $xmlConfig->getList($xpath);
            if (is_null($greyhole_pool_disks))
                throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

            // Add additional informations.
            foreach ($greyhole_pool_disks as $objectk => &$objectv) {
                $xpath        = sprintf("//system/fstab/mntent[uuid='%s']", $objectv['mntentref']);
                $fstab_object = $xmlConfig->get($xpath);
                if (is_null($fstab_object))
                    throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

                if (! is_null($fstab_object) && ! empty($fstab_object)) {
                    $fs = new OMVFilesystem($fstab_object['fsname']);
                    if (TRUE === $fs->exists()) {
                        $objectv['volume'] = $fs->getDeviceFile();
                        $objectv['label']  = $fs->getLabel();
                    }
                }

                $object = array(
                    'show' => 'Pool Disk: ' . $objectv['label'] . ' (' . $objectv['volume'] . ')',
                    'path' => $fstab_object['dir'] . '/.greyhole',
                );

                $result[] = $object;
            }
        }

        return $result;
    }

    public function getPoolMngtCandidates($params, $context) {
        global $xmlConfig;

        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        // Get Pool Disks
        $xpath = "//services/greyhole/pool_disks/disk";
        $greyhole_pool_disks = $xmlConfig->getList($xpath);
        if (is_null($greyhole_pool_disks))
            throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

        $result = array();

        // Add additional informations.
        foreach ($greyhole_pool_disks as $objectk => &$objectv) {
            $xpath = sprintf("//system/fstab/mntent[uuid='%s']", $objectv['mntentref']);
            $fstab_object = $xmlConfig->get($xpath);
            if (is_null($fstab_object))
                throw new OMVException(OMVErrorMsg::E_CONFIG_GET_OBJECT_FAILED, $xpath);

            if (! is_null($fstab_object) && ! empty($fstab_object)) {
                $fs = new OMVFilesystem($fstab_object['fsname']);
                if (TRUE === $fs->exists()) {
                    $objectv['volume'] = $fs->getDeviceFile();
                    $objectv['label']  = $fs->getLabel();
                }
            }

            $object = array(
                'show' => 'Pool Disk: ' . $objectv['label'] . ' (' . $objectv['volume'] . ')',
                'path' => $fstab_object['dir'] . '/.greyhole',
            );
            $result[] = $object;
        }

        return $result;
    }

    public function doPoolMngt($params, $context) {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "path"     : { "type" : "string" },
                "diskmngt" : { "type" : "string" }
            }
        }');

        // Get configuration data
        $greyhole_poolmngt_params = '';

        switch ($params['diskmngt']) {
            case 'wait_for':
                $greyhole_poolmngt_params .= '--wait-for=';
                break;
            case 'going':
                $greyhole_poolmngt_params .= '--going=';
                break;
            case 'gone':
                $greyhole_poolmngt_params .= '--gone=';
                break;
            case 'replaced':
                $greyhole_poolmngt_params .= '--replace=';
                break;
        }

        $cmd = 'sudo greyhole ' . $greyhole_poolmngt_params . $params['path'] . ' 2 >&1';
        OMVUtil::exec($cmd, $output, $result);
        if ($result !== 0)
            throw new OMVException(OMVErrorMsg::E_EXEC_FAILED, $cmd, implode("\n", $output));

        return 'success';
    }

    public function doBalance($params, $context) {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        $cmd = 'sudo greyhole --balance 2 >&1';
        OMVUtil::exec($cmd, $output, $result);
        if ($result !== 0)
            throw new OMVException(OMVErrorMsg::E_EXEC_FAILED, $cmd, implode("\n", $output));

        return 'success';
    }

    public function doFsck($params, $context) {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));
        // Validate the parameters of the RPC service method.
        $this->validateMethodParams($params, '{
            "type"       : "object",
            "properties" : {
                "path"                      : { "type" : "string" },
                "email_report"              : { "type" : "boolean" },
                "dont_walk_metadata_store"  : { "type" : "boolean" },
                "find_orphaned_files"       : { "type" : "boolean" },
                "checksums"                 : { "type" : "boolean" },
                "delete_orphaned_metadata"  : { "type" : "boolean" }
            }
        }');

        // Get configuration data
        array_boolval($params, 'delete_moves_to_trash');

        $path = $params['path'];

        $email_report = array_boolval($params, 'email_report');
        $greyhole_fsck_params = '';

        if ($email_report === true)
            $greyhole_fsck_params .= ' --email-report';

        $dont_walk_metadata_store = array_boolval($params, 'dont_walk_metadata_store');
        if ($dont_walk_metadata_store === true)
            $greyhole_fsck_params .= ' --dont-walk-metadata-store';

        $find_orphaned_files = array_boolval($params, 'find_orphaned_files');
        if ($find_orphaned_files === true)
            $greyhole_fsck_params .= ' --find-orphaned-files';

        $checksums = array_boolval($params, 'checksums');
        if ($checksums === true)
            $greyhole_fsck_params .= ' --checksums';

        $delete_orphaned_metadata = array_boolval($params, 'delete_orphaned_metadata');
        if ($delete_orphaned_metadata === true)
            $greyhole_fsck_params .= ' --delete-orphaned-metadata';

        $cmd = 'sudo greyhole --fsck ' . $greyhole_fsck_params . ' --dir=' . $path . ' 2 >&1';
        OMVUtil::exec($cmd, $output, $result);
        if ($result !== 0)
            throw new OMVException(OMVErrorMsg::E_EXEC_FAILED, $cmd, implode("\n", $output));

        return 'success';
    }

    public function doUnfsck($params, $context) {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        $cmd = 'sudo greyhole --cancel-fsck 2 >&1';
        OMVUtil::exec($cmd, $output, $result);
        if ($result !== 0)
            throw new OMVException(OMVErrorMsg::E_EXEC_FAILED, $cmd, implode("\n", $output));

        return 'success';
    }

    public function doEmptyTrash($params, $context) {
        // Validate the RPC caller context.
        $this->validateMethodContext($context, array( "role" => OMV_ROLE_ADMINISTRATOR ));

        $cmd = 'sudo greyhole --empty-trash 2 >&1';
        OMVUtil::exec($cmd, $output, $result);
        if ($result !== 0)
            throw new OMVException(OMVErrorMsg::E_EXEC_FAILED, $cmd, implode("\n", $output));

        return 'success';
    }

// Register the RPC service.
$rpcServiceMgr = &OMVRpcServiceMgr::getInstance();
$rpcServiceMgr->registerService(new OMVRpcServiceGreyhole());

}

?>