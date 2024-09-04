# Configure k8s master node

## Configure Master Node
```bash
#Disable Swap Space
sudo swapoff -a

cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

cat <<EOF | sudo tee /proc/sys/net/ipv4/ip_forward
1
EOF

sudo sysctl --system

cat <<EOF | sudo tee /proc/sys/net/ipv4/ip_forward
1
EOF


#Installing docker:
sudo apt install apt-transport-https ca-certificates curl software-properties-common curl
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
sudo apt update

sudo apt install docker-ce -y
sudo systemctl start docker

cat <<EOF | sudo tee /etc/docker/daemon.json
{
  "graph": "/mnt/docker-data",
  "storage-driver": "overlay",
  "exec-opts": ["native.cgroupdriver=systemd"]
}
EOF

# sudo rm -rf /etc/docker/daemon.json
sudo systemctl enable docker
sudo systemctl daemon-reload
sudo systemctl status docker

#Installing Kubernetes
sudo apt-get update
mkdir -p -m 755 /etc/apt/keyrings

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
sudo chmod 644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo chmod 644 /etc/apt/sources.list.d/kubernetes.list

# curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
# echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list

# insrall kubelet, kubeadm, kubectl binaries
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
kubeadm version
sudo mv /etc/containerd/config.toml /etc/containerd/config.toml.backup
sudo systemctl restart containerd

#### ----- on master node only -------- ####
sudo kubeadm init  ## master node initialization/decl

mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
OR 
export KUBECONFIG=/etc/kubernetes/admin.conf 

kubectl get nodes

# install cni
curl https://raw.githubusercontent.com/projectcalico/calico/v3.24.1/manifests/calico.yaml -O
kubectl apply -f calico.yaml

kubeadm token list
kubeadm token create --print-join-command

tail -f /var/log/syslog

kubectl get pods
kubectl get pods --namespace kube-system
kubectl get svc -A
ip r s
```

# Configure Worker Node
Run the above commands till the maste node only commands. Then label it as the worker node -
```bash
sudo kubectl label node <node-name> node-role.kubernetes.io/worker=worker
```

# Join the nodes -
Run this on the master node 
```bash
sudo kubeadm token create --print-join-command
```

Run the output command on the worker node

## Remove k8s binaries from a node -
```bash
kubeadm reset
sudo apt-get purge kubeadm kubectl kubelet kubernetes-cni kube*   
sudo rm -rf /etc/kubernetes/
```

> reference: [1](https://medium.com/@DaalA/step-by-step-guide-on-how-to-set-up-kubernetes-on-a-virtual-machine-b741b02ad100), [2](https://phoenixnap.com/kb/install-kubernetes-on-ubuntu)