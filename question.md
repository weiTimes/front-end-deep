# 遇到的问题及思考

* 在一个React项目中，需要刷新三级路由，以达到重新加载三极路由对应的组件的目的（刷新数据），下面简单描述一下对应的业务场景

![sample](https://tva1.sinaimg.cn/large/0081Kckwly1gkvlynnn3lj31gg0u07n5.jpg)

如上图所示，区域1是一个tabs，每个tab对应的是一个路由组件，切换tab的时候路由（三级路由）会发生改变，当我点击区域1的按钮，并在进行一些操作后，需要刷新tab的数据，由于我没有用到任何状态管理工具，
而且消息通知机制可维护性不高，所以想到了使用react router中的replace用当前的路径替换当前路径，相当于刷新路由，稍后我会解释一下是怎么实现的，在这之前，有些人肯定会有一些疑惑，我不是可以在父组件
传递参数或者从子组件拿到暴露的方法，来达到刷新的目的吗，先来看看对应的简易版代码：

```javascript

const tabs =  [
  {
    tab: '概览',
    key: 'overview',
  },          
  {
    tab: '常规佣金订单',
    key: 'normal',
  }
]

<PageContainer
  tabList={tabs}
>
  {children}
</PageContainer>

```

显而易见，我们都能看出来这是一个tabs，children对应相应路由的组件，这个对应关系我在路由配置文件中有定义，和这里要讨论的关系不大，就不贴出来了，只要知道点击某个tab的时候，有只无形的手会将对应的
路由组件插入进来，即children，然后载入tab内容区。到这里应该明白了，我们无法传递任何参数或者是获取children的实例。顺带说一下，我一开始不是使用三级路由的方式来加载子组件，而是维护一个map，存放了
key和组件的对应关系，如下所示：


```javascript

const tabs =  [
  {
    tab: '概览',
    key: 'overview',
  },          
  {
    tab: '常规佣金订单',
    key: 'normal',
  }
]

const mapComponent = {
  overview: <Overview />,
  normal: <Normal />
}

// activeKey: overview || normal
<PageContainer
  tabList={tabs}
  tabActiveKey={activeKey}
>
  {mapComponent[activeKey]}
</PageContainer>


```

这种实现方式对子组件的控制就强多了，但是有一个问题，在切换tab的时候，内容区也会有一个切换过程，在数据量大了之后，会出现肉眼可见的变化，造成数据错乱的错觉，为了优化这个问题，就有了这点思考。好，接下
来看看我是怎么用replace实现的，以下是模拟reload的代码实现：

```javascript

 const reloadPage = () => {
    let search = history.location.search;
    const timestampIndex = search.indexOf('&_timestamp');

    search = timestampIndex > -1 ? search.substr(0, timestampIndex) : search.substr(0);

    const url = `${history.location.pathname}${search}&_timestamp=${Date.now()}`;
    history.replace(url);
  };

```

主要是拿到当前路由及其参数，在最后拼上一个时间戳，当时间戳变化，说明就是刷新当前路由了，当然如果不作任何处理，只会在第一次时会重新加载组件，因为只是参数变了，路由没有发生改变，react不会作任何更新。在
Overview内有一个useEffect，内部发起了一个请求数据的接口，看以下代码：

```
// Overview.tsx

...

useEffect(() => {
 fetchSomething();
}, [_timestamp]);

...

```

可以看到useEffect依赖了_timestamp，_timestamp是我们刚才拼到地址栏中的，我们可以拿到，这段代码的意思是当_timestamp发生变化时，执行回调，即fetchSomething();到这里，我们就完成了刷新路由，
再更新数据的目的。

* 需求是实现一个可以控制相应层级展开或收起的表格控件，antd中没有对应的配置项，需要手动去实现，首先来看一下实现完成后的效果：
![效果图](https://tva1.sinaimg.cn/large/0081Kckwly1gl09eeoe5uj31js0u044j.jpg)

我来简单描述一下图中的交互效果，表格中渲染了一个多级树，每一级与上一级通过缩进区分。当点击按钮1，会展开一级树或收起所有级树（取决于当前的展开状态）；当点击按钮2，会展开二级树或收起二级以下包含二级的树；当点击按钮3，会展开三级树或收起三级以下包含三级的树，难点主要在于这三个按钮对相应级树展开或收起的控制。

我的思路核心是通过`expandedRowKeys`（受控属性）控制展开的项，当拿到数据的时候对数据进行重组，使用`Map`存储重组后的数据，其中`Map`的key是级树（一级、二级...），value是对应的ids（数据唯一标识的集合）和对应级控制按钮的展开/收起状态，数据结构如下所示：

```typescript

const map = new Map([
[1, {ids: [], isExpand: true}],
[2, {ids: [], isExpand: true}],
[3, {ids: [], isExpand: true}],
]);

```

进入页面默认是展开所有项，即`map.get(3)`拿到对应的ids再赋值给`expandedRowKeys`，对应的ids包含了一级二级三级所有的id，试想一下，如果只包含三级的id，当我们赋值给expandedRowKeys时，三级树会展开，但是一二级未展开，我们也就无法看到展开的三级树，只有展开了一二级之后才能看到三级树的展开。

然后实现点击按钮的处理逻辑，按钮的渲染是将map结构转成数组，然后遍历，数组长度为3，对应三级和三个按钮，每个按钮的展开状态取决于其中的isExpand，点击按钮在回调中传入相应的级数。主要通过当前按钮的展开状态和传入的级数判断接下来是执行展开操作还是收起操作，然后遍历修改对应的isExpand，这个主要是为了更新控制按钮的状态，然后再设置对应的expandedRowKeys，这个是控制展开的项，代码如下：

```typescript

  function handleExpand(level: number) {
    const targetExpand = idsTree.get(level).isExpand; // 当前点击的元素的展开状态

    if (targetExpand) {
      // 执行收起
      for (let i = 1; i <= 3; i++) {
        const obj = idsTree.get(i);
        if (i >= level) {
          obj.isExpand = false;
        } else {
          obj.isExpand = true;
        }

        idsTree.set(i, obj);
      }

      setExpandedRowKeys(level - 1 === 0 ? [] : idsTree.get(level - 1).ids);
    } else {
      // 执行展开
      for (let j = 1; j <= 3; j++) {
        const obj2 = idsTree.get(j);

        if (j <= level) {
          obj2.isExpand = true;
        } else {
          obj2.isExpand = false;
        }

        idsTree.set(j, obj2);
      }

      setExpandedRowKeys(idsTree.get(level).ids);
    }
  }

```

最后总结一下，一开始我是通过多个状态去控制，比如ids一个状态，isExpand一个状态，级数又一个状态，这样写到后面很难去理清逻辑，走了些弯路才决定使用这种数据结构去实现；后面遇到类似的较复杂的需求，还是用一个状态去控制，这个状态是一个适应需求的数据结构，这样实现起来会简单很多。

* 一个tab切换组件，内容由一个map进行管理，根据activeKey去加载不同的组件，如果不同的key对应同一个组件，其中组件含有搜索组件(pro-table自带的搜索组件)，在切换tab的时候即使重置搜索表单，pro-table内部请求的时候还是会带上之前设置的表单值，猜想是react会对同一个组件的内容进行合并处理，即有些状态无法得到更新。

解决：可以给map key对应的组件设置一个key值，这样就可以确保几个组件各自管理自己的状态






